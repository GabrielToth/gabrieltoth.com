pub mod capabilities;

pub use capabilities::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_registry_all_platforms() {
        let platforms = [
            PlatformKey::YouTube,
            PlatformKey::Facebook,
            PlatformKey::Instagram,
            PlatformKey::Twitch,
            PlatformKey::Kick,
            PlatformKey::TikTok,
            PlatformKey::LinkedIn,
            PlatformKey::Kwai,
            PlatformKey::Twitter,
        ];

        for p in platforms {
            let def = PlatformRegistry::get_definition(p);
            assert_eq!(def.platform, p);
            assert_eq!(def.capabilities.len(), 4);
            for content_type in PostContentType::all() {
                assert!(
                    def.capabilities.contains_key(&content_type),
                    "{:?} is missing {:?}",
                    p,
                    content_type
                );
            }
        }
    }

    #[test]
    fn test_shared_matrix_is_loaded_from_json() {
        // The matrix is compiled from the exact same file the TypeScript
        // frontend imports, so both runtimes cannot drift.
        assert_eq!(PlatformRegistry::version(), 1);
        assert_eq!(PlatformRegistry::all_definitions().len(), 9);
    }

    #[test]
    fn test_platform_keys_round_trip() {
        for p in PlatformKey::all() {
            let json = serde_json::to_string(&p).expect("serialize platform");
            assert_eq!(json, format!("\"{}\"", p.as_str()));
            let parsed: PlatformKey =
                serde_json::from_str(&json).expect("deserialize platform");
            assert_eq!(parsed, p);
        }
    }

    #[test]
    fn test_twitter_local_text_is_allowed() {
        let summary = validate_cross_platform_publishing(
            &[PlatformKey::Twitter],
            PostContentType::TextOnly,
            ExecutionEnvironment::Local,
            Some(120),
            None,
            None,
        );

        assert!(summary.all_valid);
        assert_eq!(summary.compatible_platforms, vec![PlatformKey::Twitter]);
    }

    #[test]
    fn test_cloud_only_platforms_reject_local_image_posts() {
        let platforms = [
            PlatformKey::Facebook,
            PlatformKey::Instagram,
            PlatformKey::TikTok,
            PlatformKey::LinkedIn,
            PlatformKey::Kwai,
        ];

        for p in platforms {
            let summary = validate_cross_platform_publishing(
                &[p],
                PostContentType::ImageText,
                ExecutionEnvironment::Local,
                Some(100),
                Some(1024),
                None,
            );

            // Kwai does not support image posts at all; the others support it
            // but must reject LOCAL execution.
            assert!(!summary.all_valid, "{:?} should not be valid in LOCAL", p);
            let reasons = summary.results[0].reasons.join(" ");
            assert!(
                reasons.contains("CLOUD") || reasons.contains("não aceita"),
                "unexpected reasons for {:?}: {}",
                p,
                reasons
            );
        }
    }

    #[test]
    fn test_long_video_duration_limits() {
        let summary = validate_cross_platform_publishing(
            &[PlatformKey::YouTube],
            PostContentType::LongVideo,
            ExecutionEnvironment::Cloud,
            None,
            None,
            Some(10), // below the 33s minimum
        );

        assert!(!summary.all_valid);
        assert!(summary.results[0].reasons[0].contains("menor que o mínimo"));
    }

    #[test]
    fn test_text_only_compatibility() {
        let platforms = vec![PlatformKey::Facebook, PlatformKey::LinkedIn, PlatformKey::Twitter];
        let summary = validate_cross_platform_publishing(
            &platforms,
            PostContentType::TextOnly,
            ExecutionEnvironment::Cloud,
            Some(250),
            None,
            None,
        );

        assert!(summary.all_valid);
        assert_eq!(summary.compatible_platforms.len(), 3);
        assert!(summary.incompatible_platforms.is_empty());
    }

    #[test]
    fn test_text_only_rejected_on_video_and_image_platforms() {
        let platforms = vec![
            PlatformKey::YouTube,
            PlatformKey::Instagram,
            PlatformKey::Twitch,
            PlatformKey::Kick,
            PlatformKey::TikTok,
            PlatformKey::Kwai,
        ];
        let summary = validate_cross_platform_publishing(
            &platforms,
            PostContentType::TextOnly,
            ExecutionEnvironment::Cloud,
            Some(100),
            None,
            None,
        );

        assert!(!summary.all_valid);
        assert_eq!(summary.incompatible_platforms.len(), 6);
        assert!(summary.compatible_platforms.is_empty());
    }

    #[test]
    fn test_local_rejection_for_cloud_only() {
        let platforms = vec![PlatformKey::Facebook, PlatformKey::Twitter];
        let summary = validate_cross_platform_publishing(
            &platforms,
            PostContentType::TextOnly,
            ExecutionEnvironment::Local,
            Some(100),
            None,
            None,
        );

        assert!(!summary.all_valid);
        assert_eq!(summary.compatible_platforms, vec![PlatformKey::Twitter]);
        assert_eq!(summary.incompatible_platforms, vec![PlatformKey::Facebook]);
    }

    #[test]
    fn test_short_video_duration_limits() {
        let platforms = vec![PlatformKey::YouTube];
        let summary = validate_cross_platform_publishing(
            &platforms,
            PostContentType::ShortVideo,
            ExecutionEnvironment::Cloud,
            None,
            None,
            Some(75), // > 60s
        );

        assert!(!summary.all_valid);
        assert_eq!(summary.incompatible_platforms, vec![PlatformKey::YouTube]);
        assert!(summary.results[0].reasons[0].contains("excede o tempo limite"));
    }
}
