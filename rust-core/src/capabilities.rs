use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::OnceLock;

/// Shared matrix file used by both the TypeScript app and this Rust core.
/// Keeping a single file is what guarantees CLOUD/LOCAL parity.
const MATRIX_JSON: &str =
    include_str!("../../src/lib/posting/platform-capabilities.data.json");

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlatformKey {
    YouTube,
    Facebook,
    Instagram,
    Twitch,
    Kick,
    TikTok,
    LinkedIn,
    Kwai,
    Twitter,
}

impl PlatformKey {
    /// Stable order used by diagnostics and bulk operations.
    pub fn all() -> [PlatformKey; 9] {
        [
            PlatformKey::YouTube,
            PlatformKey::Facebook,
            PlatformKey::Instagram,
            PlatformKey::Twitch,
            PlatformKey::Kick,
            PlatformKey::TikTok,
            PlatformKey::LinkedIn,
            PlatformKey::Kwai,
            PlatformKey::Twitter,
        ]
    }

    pub fn as_str(self) -> &'static str {
        match self {
            PlatformKey::YouTube => "youtube",
            PlatformKey::Facebook => "facebook",
            PlatformKey::Instagram => "instagram",
            PlatformKey::Twitch => "twitch",
            PlatformKey::Kick => "kick",
            PlatformKey::TikTok => "tiktok",
            PlatformKey::LinkedIn => "linkedin",
            PlatformKey::Kwai => "kwai",
            PlatformKey::Twitter => "twitter",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PostContentType {
    TextOnly,
    ImageText,
    ShortVideo,
    LongVideo,
}

impl PostContentType {
    pub fn all() -> [PostContentType; 4] {
        [
            PostContentType::TextOnly,
            PostContentType::ImageText,
            PostContentType::ShortVideo,
            PostContentType::LongVideo,
        ]
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionEnvironment {
    Local,
    Cloud,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LiveChatProtocol {
    WebsocketIrc,
    PusherWs,
    RestPolling,
    Webhook,
    EmulatedCloud,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveChatSupport {
    pub supported: bool,
    pub protocol: LiveChatProtocol,
    pub allowed_in_local: bool,
    pub allowed_in_cloud: bool,
    pub official_api: bool,
    #[serde(default)]
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentTypeCapability {
    pub supported: bool,
    pub allowed_in_local: bool,
    pub allowed_in_cloud: bool,
    pub max_characters: Option<usize>,
    pub max_file_size_bytes: Option<u64>,
    pub max_duration_seconds: Option<u32>,
    pub min_duration_seconds: Option<u32>,
    #[serde(default)]
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformCapabilityDefinition {
    pub platform: PlatformKey,
    pub display_name: String,
    pub official_api_docs_url: String,
    pub live_chat: LiveChatSupport,
    pub capabilities: HashMap<PostContentType, ContentTypeCapability>,
}

#[derive(Debug, Deserialize)]
struct MatrixFile {
    version: u32,
    platforms: HashMap<PlatformKey, PlatformCapabilityDefinition>,
}

static MATRIX: OnceLock<(u32, HashMap<PlatformKey, PlatformCapabilityDefinition>)> =
    OnceLock::new();

fn load_matrix() -> &'static (u32, HashMap<PlatformKey, PlatformCapabilityDefinition>) {
    MATRIX.get_or_init(|| {
        let parsed: MatrixFile = serde_json::from_str(MATRIX_JSON)
            .expect("shared platform-capabilities.data.json must be valid");
        (parsed.version, parsed.platforms)
    })
}

pub struct PlatformRegistry;

impl PlatformRegistry {
    /// Version of the shared matrix currently compiled into the core.
    pub fn version() -> u32 {
        load_matrix().0
    }

    pub fn get_definition(platform: PlatformKey) -> PlatformCapabilityDefinition {
        load_matrix()
            .1
            .get(&platform)
            .cloned()
            .unwrap_or_else(|| {
                panic!(
                    "platform {:?} is missing from the shared capability matrix",
                    platform
                )
            })
    }

    /// Returns every platform definition in stable order.
    pub fn all_definitions() -> Vec<PlatformCapabilityDefinition> {
        PlatformKey::all()
            .into_iter()
            .map(PlatformRegistry::get_definition)
            .collect()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityResult {
    pub platform: PlatformKey,
    pub is_compatible: bool,
    pub reasons: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationSummary {
    pub all_valid: bool,
    pub results: Vec<CompatibilityResult>,
    pub compatible_platforms: Vec<PlatformKey>,
    pub incompatible_platforms: Vec<PlatformKey>,
}

pub fn validate_cross_platform_publishing(
    platforms: &[PlatformKey],
    content_type: PostContentType,
    environment: ExecutionEnvironment,
    character_count: Option<usize>,
    file_size_bytes: Option<u64>,
    duration_seconds: Option<u32>,
) -> ValidationSummary {
    let mut results = Vec::new();
    let mut compatible_platforms = Vec::new();
    let mut incompatible_platforms = Vec::new();
    let mut all_valid = true;

    for &plat in platforms {
        let def = PlatformRegistry::get_definition(plat);
        let cap_opt = def.capabilities.get(&content_type);
        let mut reasons = Vec::new();

        match cap_opt {
            Some(cap) => {
                if !cap.supported {
                    reasons.push(cap.notes.clone());
                } else {
                    if environment == ExecutionEnvironment::Local && !cap.allowed_in_local {
                        reasons.push(
                            "Requer modo CLOUD: A API oficial exige credenciais confidenciais ou não possui CORS/chaves públicas.".to_string(),
                        );
                    }

                    if let (Some(max_chars), Some(count)) = (cap.max_characters, character_count) {
                        if count > max_chars {
                            reasons.push(format!(
                                "Texto de {} caracteres excede o limite máximo de {}.",
                                count, max_chars
                            ));
                        }
                    }

                    if let (Some(max_size), Some(size)) = (cap.max_file_size_bytes, file_size_bytes) {
                        if size > max_size {
                            reasons.push(format!(
                                "Arquivo com {} bytes excede o limite de {} bytes.",
                                size, max_size
                            ));
                        }
                    }

                    if let Some(dur) = duration_seconds {
                        if let Some(max_dur) = cap.max_duration_seconds {
                            if dur > max_dur {
                                reasons.push(format!(
                                    "Duração de {}s excede o tempo limite de {}s.",
                                    dur, max_dur
                                ));
                            }
                        }
                        if let Some(min_dur) = cap.min_duration_seconds {
                            if dur < min_dur {
                                reasons.push(format!(
                                    "Duração de {}s é menor que o mínimo de {}s.",
                                    dur, min_dur
                                ));
                            }
                        }
                    }
                }
            }
            None => {
                reasons.push(format!("Formato de conteúdo não mapeado para {:?}.", plat));
            }
        }

        let is_comp = reasons.is_empty();
        if is_comp {
            compatible_platforms.push(plat);
        } else {
            all_valid = false;
            incompatible_platforms.push(plat);
        }

        results.push(CompatibilityResult {
            platform: plat,
            is_compatible: is_comp,
            reasons,
        });
    }

    ValidationSummary {
        all_valid,
        results,
        compatible_platforms,
        incompatible_platforms,
    }
}
