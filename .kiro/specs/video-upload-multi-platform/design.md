# Design Document: Video Upload Multi-Platform

## Overview

Este documento descreve o design técnico do módulo de upload de vídeos multi-plataforma, um sistema que permite aos usuários autenticados fazer upload, editar metadados e publicar vídeos simultaneamente em YouTube, Facebook, Instagram e TikTok.

O sistema é construído como uma aplicação full-stack usando Next.js 16 com React 19, TypeScript, e PostgreSQL. A arquitetura segue o padrão de separação entre frontend (React components) e backend (API routes + serviços), com processamento assíncrono via fila de jobs, armazenamento temporário de vídeos, e integração segura com APIs externas via OAuth 2.0.

### Principais Características

- Upload de vídeos via drag & drop ou seleção de arquivo
- Edição de metadados (título, descrição, tags) com suporte multi-idioma
- Autenticação OAuth 2.0 para YouTube, Facebook, Instagram e TikTok
- Validação de vídeos específica por plataforma
- Fila de processamento com feedback em tempo real
- Gerenciamento de rate limits das APIs externas
- Retry logic com exponential backoff
- Armazenamento seguro de tokens com criptografia AES-256
- Histórico de publicações com filtros e ordenação
- Logs de auditoria para operações críticas
- Interface multi-idioma (pt-BR, en, es, de)


## Architecture

### System Architecture

O sistema segue uma arquitetura em camadas com separação clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload UI    │  │ Metadata     │  │ Progress     │     │
│  │ Component    │  │ Editor       │  │ Tracker      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Platform     │  │ History      │  │ OAuth        │     │
│  │ Selector     │  │ Viewer       │  │ Connect      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls (REST)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /api/upload  │  │ /api/oauth   │  │ /api/publish │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /api/history │  │ /api/status  │  │ /api/retry   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Video        │  │ OAuth        │  │ Queue        │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Platform     │  │ Rate Limiter │  │ Encryption   │     │
│  │ Publisher    │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ File Storage │  │ Redis Queue  │     │
│  │ Database     │  │ (Temp)       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External APIs                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ YouTube      │  │ Facebook     │  │ Instagram    │     │
│  │ Data API v3  │  │ Graph API    │  │ Graph API    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐                                          │
│  │ TikTok API   │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 19, Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (via pg library)
- **Cache/Queue**: Redis (via ioredis or Upstash Redis)
- **File Storage**: Local filesystem (temporary) or cloud storage (S3-compatible)
- **Authentication**: OAuth 2.0 (platform-specific flows)
- **Encryption**: Node.js crypto module (AES-256-GCM)
- **Testing**: Vitest, Testing Library, Playwright


## Components and Interfaces

### Frontend Components

#### 1. VideoUploadPage Component

Componente principal que orquestra todo o fluxo de upload.

```typescript
interface VideoUploadPageProps {
  locale: string; // pt-BR, en, es, de
}

interface VideoUploadState {
  file: File | null;
  metadata: VideoMetadata;
  selectedPlatforms: Platform[];
  uploadStatus: UploadStatus;
  validationErrors: ValidationError[];
}
```

#### 2. DragDropUploader Component

Interface de upload com drag & drop.

```typescript
interface DragDropUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[]; // ['video/mp4', 'video/quicktime', ...]
  maxSize: number; // bytes
  disabled: boolean;
}
```

#### 3. MetadataEditor Component

Editor de metadados do vídeo.

```typescript
interface MetadataEditorProps {
  metadata: VideoMetadata;
  onChange: (metadata: VideoMetadata) => void;
  locale: string;
}

interface VideoMetadata {
  title: string; // max 100 chars
  description: string; // max 5000 chars
  tags: string[]; // comma-separated
}
```

#### 4. PlatformSelector Component

Seletor de plataformas de destino.

```typescript
interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformToggle: (platform: Platform) => void;
  authStatus: Record<Platform, AuthStatus>;
  onAuthClick: (platform: Platform) => void;
}

type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

interface AuthStatus {
  isAuthenticated: boolean;
  expiresAt: Date | null;
  username: string | null;
}
```

#### 5. ProgressTracker Component

Rastreador de progresso em tempo real.

```typescript
interface ProgressTrackerProps {
  uploads: UploadProgress[];
}

interface UploadProgress {
  id: string;
  platform: Platform;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
  error: string | null;
}
```

#### 6. PublicationHistory Component

Visualizador de histórico de publicações.

```typescript
interface PublicationHistoryProps {
  userId: string;
  locale: string;
}

interface Publication {
  id: string;
  videoTitle: string;
  publishedAt: Date;
  platforms: PlatformPublication[];
}

interface PlatformPublication {
  platform: Platform;
  status: 'success' | 'failed';
  videoUrl: string | null;
  videoId: string | null;
  error: string | null;
}
```

#### 7. OAuthConnectButton Component

Botão de conexão OAuth para plataformas.

```typescript
interface OAuthConnectButtonProps {
  platform: Platform;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}
```


### Backend API Routes

#### 1. POST /api/video/upload

Inicia o upload de um vídeo.

```typescript
// Request
interface UploadRequest {
  file: FormData; // video file
  metadata: VideoMetadata;
  platforms: Platform[];
}

// Response
interface UploadResponse {
  success: boolean;
  uploadId: string;
  queuePosition: number;
}
```

#### 2. POST /api/oauth/authorize

Inicia o fluxo OAuth para uma plataforma.

```typescript
// Request
interface OAuthAuthorizeRequest {
  platform: Platform;
  redirectUri: string;
}

// Response
interface OAuthAuthorizeResponse {
  authUrl: string;
  state: string; // CSRF token
}
```

#### 3. GET /api/oauth/callback

Callback OAuth após autorização.

```typescript
// Query Parameters
interface OAuthCallbackQuery {
  code: string;
  state: string;
  platform: Platform;
}

// Response
interface OAuthCallbackResponse {
  success: boolean;
  platform: Platform;
  username: string;
  expiresAt: Date;
}
```

#### 4. DELETE /api/oauth/disconnect

Desconecta uma plataforma.

```typescript
// Request
interface DisconnectRequest {
  platform: Platform;
}

// Response
interface DisconnectResponse {
  success: boolean;
}
```

#### 5. GET /api/video/status/:uploadId

Obtém o status de um upload.

```typescript
// Response
interface StatusResponse {
  uploadId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  platforms: PlatformStatus[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformStatus {
  platform: Platform;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  videoId: string | null;
  videoUrl: string | null;
  error: string | null;
}
```

#### 6. POST /api/video/retry/:uploadId

Tenta novamente um upload falhado.

```typescript
// Request
interface RetryRequest {
  platforms?: Platform[]; // optional, retry specific platforms
}

// Response
interface RetryResponse {
  success: boolean;
  uploadId: string;
  retriedPlatforms: Platform[];
}
```

#### 7. GET /api/video/history

Obtém o histórico de publicações.

```typescript
// Query Parameters
interface HistoryQuery {
  page?: number;
  limit?: number;
  platform?: Platform;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  sortBy?: 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface HistoryResponse {
  publications: Publication[];
  total: number;
  page: number;
  limit: number;
}
```

#### 8. GET /api/oauth/status

Obtém o status de autenticação de todas as plataformas.

```typescript
// Response
interface OAuthStatusResponse {
  platforms: Record<Platform, AuthStatus>;
}
```

#### 9. POST /api/video/validate

Valida um vídeo antes do upload.

```typescript
// Request
interface ValidateRequest {
  fileSize: number;
  fileType: string;
  duration: number; // seconds
  platforms: Platform[];
}

// Response
interface ValidateResponse {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  platform: Platform;
  field: 'size' | 'format' | 'duration';
  message: string;
  limit: string;
}
```


### Backend Services

#### 1. VideoService

Gerencia operações de vídeo.

```typescript
class VideoService {
  async saveTemporaryFile(file: File, userId: string): Promise<string>;
  async deleteTemporaryFile(filePath: string): Promise<void>;
  async validateVideo(file: File, platforms: Platform[]): Promise<ValidationResult>;
  async getVideoMetadata(filePath: string): Promise<VideoFileMetadata>;
  async cleanupOldFiles(): Promise<void>; // Delete files older than 24h
}

interface VideoFileMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  codec: string;
  bitrate: number;
}
```

#### 2. OAuthService

Gerencia autenticação OAuth.

```typescript
class OAuthService {
  async getAuthorizationUrl(platform: Platform, redirectUri: string): Promise<string>;
  async exchangeCodeForToken(platform: Platform, code: string): Promise<TokenData>;
  async refreshToken(platform: Platform, refreshToken: string): Promise<TokenData>;
  async revokeToken(platform: Platform, token: string): Promise<void>;
  async validateToken(platform: Platform, token: string): Promise<boolean>;
}

interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string[];
}
```

#### 3. EncryptionService

Gerencia criptografia de tokens.

```typescript
class EncryptionService {
  encrypt(data: string): string;
  decrypt(encryptedData: string): string;
  generateKey(): string;
  hash(data: string): string; // SHA-256
}
```

#### 4. QueueService

Gerencia a fila de processamento.

```typescript
class QueueService {
  async addJob(job: UploadJob): Promise<string>;
  async getJob(jobId: string): Promise<UploadJob | null>;
  async updateJobStatus(jobId: string, status: JobStatus): Promise<void>;
  async getQueuePosition(jobId: string): Promise<number>;
  async processNextJob(): Promise<void>;
}

interface UploadJob {
  id: string;
  userId: string;
  filePath: string;
  metadata: VideoMetadata;
  platforms: Platform[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  platformStatuses: Record<Platform, PlatformJobStatus>;
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformJobStatus {
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  videoId: string | null;
  error: string | null;
  retryCount: number;
}
```

#### 5. PlatformPublisher

Publica vídeos nas plataformas externas.

```typescript
class PlatformPublisher {
  async publishToYouTube(video: VideoUpload, token: string): Promise<PublishResult>;
  async publishToFacebook(video: VideoUpload, token: string): Promise<PublishResult>;
  async publishToInstagram(video: VideoUpload, token: string): Promise<PublishResult>;
  async publishToTikTok(video: VideoUpload, token: string): Promise<PublishResult>;
}

interface VideoUpload {
  filePath: string;
  metadata: VideoMetadata;
  userId: string;
}

interface PublishResult {
  success: boolean;
  videoId: string | null;
  videoUrl: string | null;
  error: string | null;
}
```

#### 6. RateLimiterService

Gerencia rate limits das APIs.

```typescript
class RateLimiterService {
  async checkLimit(platform: Platform, userId: string): Promise<boolean>;
  async recordRequest(platform: Platform, userId: string): Promise<void>;
  async getTimeUntilReset(platform: Platform, userId: string): Promise<number>;
  async getRemainingRequests(platform: Platform, userId: string): Promise<number>;
}

// Rate limits per platform (per day)
const RATE_LIMITS = {
  youtube: 10000,
  facebook: 200,
  instagram: 200,
  tiktok: 100,
};
```

#### 7. RetryHandler

Gerencia lógica de retry.

```typescript
class RetryHandler {
  async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
  
  calculateBackoff(attempt: number): number; // Exponential backoff
}

interface RetryOptions {
  maxAttempts: number; // default: 3
  baseDelay: number; // default: 2000ms
  maxDelay: number; // default: 30000ms
  retryableErrors: string[]; // error codes to retry
}
```

#### 8. AuditLogger

Registra operações de auditoria.

```typescript
class AuditLogger {
  async logOAuthAttempt(userId: string, platform: Platform, success: boolean): Promise<void>;
  async logUpload(userId: string, fileMetadata: VideoFileMetadata): Promise<void>;
  async logPublication(userId: string, platform: Platform, success: boolean, error?: string): Promise<void>;
  async logTokenAccess(userId: string, platform: Platform, operation: string): Promise<void>;
  async logError(userId: string, error: Error, context: Record<string, any>): Promise<void>;
}
```


## Data Models

### Database Schema (PostgreSQL)

#### 1. users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

#### 2. platform_tokens Table

Armazena tokens OAuth criptografados.

```sql
CREATE TABLE platform_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'youtube', 'facebook', 'instagram', 'tiktok'
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT, -- encrypted, nullable
  expires_at TIMESTAMP NOT NULL,
  scope TEXT[], -- array of scopes
  username VARCHAR(255), -- platform username
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_platform_tokens_user_id ON platform_tokens(user_id);
CREATE INDEX idx_platform_tokens_platform ON platform_tokens(platform);
CREATE INDEX idx_platform_tokens_expires_at ON platform_tokens(expires_at);
```

#### 3. video_uploads Table

Armazena informações de uploads.

```sql
CREATE TABLE video_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  file_type VARCHAR(50) NOT NULL,
  duration INTEGER, -- seconds
  title VARCHAR(100) NOT NULL,
  description TEXT,
  tags TEXT[], -- array of tags
  status VARCHAR(50) NOT NULL, -- 'queued', 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX idx_video_uploads_status ON video_uploads(status);
CREATE INDEX idx_video_uploads_created_at ON video_uploads(created_at);
```

#### 4. platform_publications Table

Armazena status de publicação por plataforma.

```sql
CREATE TABLE platform_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'pending', 'uploading', 'success', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  video_id VARCHAR(255), -- platform video ID
  video_url TEXT, -- platform video URL
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(upload_id, platform)
);

CREATE INDEX idx_platform_publications_upload_id ON platform_publications(upload_id);
CREATE INDEX idx_platform_publications_platform ON platform_publications(platform);
CREATE INDEX idx_platform_publications_status ON platform_publications(status);
```

#### 5. audit_logs Table

Armazena logs de auditoria.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL, -- 'oauth_attempt', 'upload', 'publication', 'token_access'
  platform VARCHAR(50),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB, -- additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_platform ON audit_logs(platform);
```

#### 6. rate_limits Table

Rastreia uso de rate limits.

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, window_start)
);

CREATE INDEX idx_rate_limits_user_platform ON rate_limits(user_id, platform);
CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);
```

### Redis Data Structures

#### 1. Upload Queue

```typescript
// Queue key: upload:queue
// Sorted set with score = timestamp
ZADD upload:queue <timestamp> <uploadId>

// Job data key: upload:job:<uploadId>
// Hash with job details
HSET upload:job:<uploadId> 
  userId <userId>
  filePath <filePath>
  status <status>
  metadata <JSON>
  platforms <JSON>
```

#### 2. Progress Tracking

```typescript
// Progress key: upload:progress:<uploadId>:<platform>
// Hash with progress details
HSET upload:progress:<uploadId>:<platform>
  status <status>
  progress <0-100>
  error <errorMessage>
```

#### 3. Rate Limit Counters

```typescript
// Rate limit key: ratelimit:<platform>:<userId>:<window>
// String with counter, expires after window
SET ratelimit:<platform>:<userId>:<window> <count>
EXPIRE ratelimit:<platform>:<userId>:<window> <seconds>
```


### OAuth Configuration

#### YouTube OAuth 2.0

```typescript
const YOUTUBE_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ],
  clientId: process.env.YOUTUBE_CLIENT_ID,
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/oauth/callback?platform=youtube`,
};
```

#### Facebook OAuth 2.0

```typescript
const FACEBOOK_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  scopes: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
  ],
  clientId: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: `${process.env.APP_URL}/api/oauth/callback?platform=facebook`,
};
```

#### Instagram OAuth 2.0

```typescript
const INSTAGRAM_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
  tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
  scopes: [
    'instagram_basic',
    'instagram_content_publish',
  ],
  clientId: process.env.INSTAGRAM_APP_ID,
  clientSecret: process.env.INSTAGRAM_APP_SECRET,
  redirectUri: `${process.env.APP_URL}/api/oauth/callback?platform=instagram`,
};
```

#### TikTok OAuth 2.0

```typescript
const TIKTOK_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize',
  tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token',
  scopes: [
    'video.upload',
    'video.publish',
  ],
  clientId: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/oauth/callback?platform=tiktok`,
};
```

### Platform API Integration

#### YouTube Data API v3

```typescript
class YouTubePublisher {
  private apiBaseUrl = 'https://www.googleapis.com/youtube/v3';
  
  async uploadVideo(video: VideoUpload, token: string): Promise<PublishResult> {
    // 1. Initialize resumable upload
    const initResponse = await fetch(`${this.apiBaseUrl}/videos?uploadType=resumable&part=snippet,status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
      },
      body: JSON.stringify({
        snippet: {
          title: video.metadata.title,
          description: video.metadata.description,
          tags: video.metadata.tags,
        },
        status: {
          privacyStatus: 'public',
        },
      }),
    });
    
    const uploadUrl = initResponse.headers.get('Location');
    
    // 2. Upload video file in chunks
    const fileStream = fs.createReadStream(video.filePath);
    const uploadResponse = await this.uploadInChunks(uploadUrl, fileStream);
    
    return {
      success: true,
      videoId: uploadResponse.id,
      videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.id}`,
      error: null,
    };
  }
  
  private async uploadInChunks(url: string, stream: ReadStream): Promise<any> {
    // Implement chunked upload with progress tracking
  }
}
```

#### Facebook Graph API

```typescript
class FacebookPublisher {
  private apiBaseUrl = 'https://graph.facebook.com/v18.0';
  
  async uploadVideo(video: VideoUpload, token: string): Promise<PublishResult> {
    // 1. Get page ID
    const pagesResponse = await fetch(`${this.apiBaseUrl}/me/accounts?access_token=${token}`);
    const pages = await pagesResponse.json();
    const pageId = pages.data[0].id;
    const pageToken = pages.data[0].access_token;
    
    // 2. Initialize resumable upload
    const initResponse = await fetch(`${this.apiBaseUrl}/${pageId}/videos`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: pageToken,
        upload_phase: 'start',
        file_size: fs.statSync(video.filePath).size.toString(),
      }),
    });
    
    const { video_id, upload_session_id } = await initResponse.json();
    
    // 3. Upload video file
    const fileBuffer = fs.readFileSync(video.filePath);
    const uploadResponse = await fetch(`${this.apiBaseUrl}/${pageId}/videos`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: pageToken,
        upload_phase: 'transfer',
        upload_session_id,
        video_file_chunk: fileBuffer.toString('base64'),
      }),
    });
    
    // 4. Finish upload
    await fetch(`${this.apiBaseUrl}/${pageId}/videos`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: pageToken,
        upload_phase: 'finish',
        upload_session_id,
        title: video.metadata.title,
        description: video.metadata.description,
      }),
    });
    
    return {
      success: true,
      videoId: video_id,
      videoUrl: `https://www.facebook.com/watch/?v=${video_id}`,
      error: null,
    };
  }
}
```

#### Instagram Graph API

```typescript
class InstagramPublisher {
  private apiBaseUrl = 'https://graph.instagram.com';
  
  async uploadVideo(video: VideoUpload, token: string): Promise<PublishResult> {
    // 1. Get Instagram Business Account ID
    const accountResponse = await fetch(`${this.apiBaseUrl}/me?fields=id&access_token=${token}`);
    const { id: accountId } = await accountResponse.json();
    
    // 2. Create media container
    const containerResponse = await fetch(`${this.apiBaseUrl}/${accountId}/media`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: token,
        media_type: 'VIDEO',
        video_url: video.filePath, // Must be publicly accessible URL
        caption: `${video.metadata.title}\n\n${video.metadata.description}`,
      }),
    });
    
    const { id: containerId } = await containerResponse.json();
    
    // 3. Publish media container
    const publishResponse = await fetch(`${this.apiBaseUrl}/${accountId}/media_publish`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: token,
        creation_id: containerId,
      }),
    });
    
    const { id: mediaId } = await publishResponse.json();
    
    return {
      success: true,
      videoId: mediaId,
      videoUrl: `https://www.instagram.com/p/${mediaId}`,
      error: null,
    };
  }
}
```

#### TikTok API

```typescript
class TikTokPublisher {
  private apiBaseUrl = 'https://open.tiktokapis.com';
  
  async uploadVideo(video: VideoUpload, token: string): Promise<PublishResult> {
    // 1. Initialize upload
    const initResponse = await fetch(`${this.apiBaseUrl}/v2/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: video.metadata.title,
          description: video.metadata.description,
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: fs.statSync(video.filePath).size,
        },
      }),
    });
    
    const { data } = await initResponse.json();
    const { publish_id, upload_url } = data;
    
    // 2. Upload video file
    const fileBuffer = fs.readFileSync(video.filePath);
    await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: fileBuffer,
    });
    
    // 3. Confirm upload
    const confirmResponse = await fetch(`${this.apiBaseUrl}/v2/post/publish/status/${publish_id}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const confirmData = await confirmResponse.json();
    
    return {
      success: true,
      videoId: publish_id,
      videoUrl: confirmData.data.share_url,
      error: null,
    };
  }
}
```


### Platform Validation Rules

```typescript
const PLATFORM_VALIDATION_RULES = {
  youtube: {
    maxSize: 256 * 1024 * 1024 * 1024, // 256GB
    formats: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'],
    minDuration: 0,
    maxDuration: Infinity,
  },
  facebook: {
    maxSize: 10 * 1024 * 1024 * 1024, // 10GB
    formats: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'],
    minDuration: 0,
    maxDuration: Infinity,
  },
  instagram: {
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    formats: ['video/mp4', 'video/quicktime'],
    minDuration: 3,
    maxDuration: 3600, // 60 minutes
  },
  tiktok: {
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    formats: ['video/mp4', 'video/quicktime'],
    minDuration: 3,
    maxDuration: 600, // 10 minutes
  },
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated to eliminate redundancy:

1. **OAuth flow initiation (4.1-4.4)**: These four properties test the same behavior for different platforms. They can be combined into a single property that tests OAuth URL generation for all platforms.

2. **Platform validation rules (6.1-6.4, 6.6-6.7)**: These properties test size and duration limits for different platforms. They can be combined into comprehensive validation properties.

3. **Rate limiter delays (10.3-10.6)**: These four properties test the same delay behavior for different platforms. They can be combined into a single property.

4. **API response handling (9.4-9.7)**: These properties test that successful uploads return IDs. They can be combined into a single property.

5. **Audit logging (13.1-13.5)**: These properties test that different operations create log entries. They can be combined into a single comprehensive logging property.

6. **Language support (14.1-14.4)**: These are examples testing that specific languages are available. They don't need separate properties.

7. **Token encryption round-trip (4.7, 5.1, 5.4)**: These test encryption and decryption. They can be combined into a single round-trip property.

8. **File upload acceptance (1.1-1.2)**: Both test that files can be uploaded through different methods. They can be combined.

9. **Metadata editor fields (2.1-2.3)**: These are examples testing UI elements. They can be verified with a single example test.

10. **Progress tracker updates (8.1-8.2, 8.5)**: These test progress display and updates. They can be combined into properties about progress tracking behavior.

### Property 1: File Upload Acceptance

*For any* valid video file, the upload interface should accept it whether provided through drag-and-drop or file browser selection, and display the file name and size.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Video Format Validation

*For any* video file, the validator should accept only files with formats MP4, MOV, AVI, or WMV, and reject all other formats with an error message listing supported formats.

**Validates: Requirements 1.4, 1.6, 6.5**

### Property 3: Platform-Specific Size Validation

*For any* video file and selected platform, the validator should enforce the platform's size limit (YouTube: 256GB, Facebook: 10GB, Instagram: 4GB, TikTok: 4GB) and display an error message with size constraints when exceeded.

**Validates: Requirements 1.5, 1.7, 6.1, 6.2, 6.3, 6.4, 6.8**

### Property 4: Platform-Specific Duration Validation

*For any* video file, when Instagram is selected, the validator should enforce duration between 3 seconds and 60 minutes, and when TikTok is selected, enforce duration between 3 seconds and 10 minutes, displaying specific validation errors when violated.

**Validates: Requirements 6.6, 6.7, 6.8**

### Property 5: Temporary Storage Persistence

*For any* uploaded video file, it should be stored in temporary storage associated with the user account until publication completes or 24 hours elapse, whichever comes first.

**Validates: Requirements 1.8, 15.1, 15.2, 15.3, 15.4**

### Property 6: Temporary File Encryption

*For any* video file stored in temporary storage, it should be encrypted at rest using AES-256 encryption.

**Validates: Requirements 15.5**

### Property 7: Upload Cancellation Cleanup

*For any* upload in progress, if the user cancels it, the temporary file should be deleted immediately.

**Validates: Requirements 15.6**

### Property 8: Metadata Character Limit Warnings

*For any* metadata input, when the title exceeds 100 characters or the description exceeds 5000 characters, a character count warning should be displayed.

**Validates: Requirements 2.4, 2.5**

### Property 9: Tag Parsing

*For any* comma-separated string input in the tags field, it should be correctly parsed into an array of individual tags.

**Validates: Requirements 2.6**

### Property 10: Metadata Persistence

*For any* metadata changes made in the editor, they should be saved before publication is initiated.

**Validates: Requirements 2.7**

### Property 11: Multi-Language Text Support

*For any* text input containing characters from Portuguese, English, Spanish, or German, the metadata editor should accept and store it correctly.

**Validates: Requirements 2.8**

### Property 12: Platform Selection State

*For any* combination of platform selections, the module should correctly track which platforms are selected and update the state accordingly.

**Validates: Requirements 3.2**

### Property 13: Authentication Status Verification

*For any* platform selection, the module should verify the OAuth authentication status and display an authentication prompt if the platform is not authenticated.

**Validates: Requirements 3.3, 3.4**

### Property 14: Platform Requirements Display

*For any* selected platform, the module should display that platform's specific requirements (size limits, duration limits, format requirements).

**Validates: Requirements 3.5**

### Property 15: OAuth Authorization URL Generation

*For any* supported platform (YouTube, Facebook, Instagram, TikTok), the OAuth manager should generate a valid authorization URL with the correct endpoint, client ID, scopes, and redirect URI for that platform.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 16: OAuth Token Reception

*For any* successful OAuth callback, the OAuth manager should receive and store an access token with expiration information.

**Validates: Requirements 4.5**

### Property 17: OAuth Error Handling

*For any* failed OAuth attempt, the OAuth manager should display an error message with a retry option.

**Validates: Requirements 4.6**

### Property 18: Token Encryption Round-Trip

*For any* access token, encrypting it with AES-256 and then decrypting it should return the original token value.

**Validates: Requirements 4.7, 5.1, 5.4**

### Property 19: Platform Disconnection

*For any* authenticated platform, when the user disconnects it, the associated access token should be deleted from storage.

**Validates: Requirements 4.8, 5.6**

### Property 20: Token Expiration Handling

*For any* access token, when its expiration time is reached, it should be marked as invalid and trigger a re-authentication prompt when accessed.

**Validates: Requirements 4.9, 5.5**

### Property 21: Token User Association

*For any* access token, it should be correctly associated with the user account that authorized it.

**Validates: Requirements 5.2**

### Property 22: Token Expiration Storage

*For any* access token, its expiration timestamp should be stored and retrievable.

**Validates: Requirements 5.3**

### Property 23: Queue Addition

*For any* publication initiation, the video should be added to the processing queue with status "queued".

**Validates: Requirements 7.1**

### Property 24: FIFO Queue Processing

*For any* sequence of videos added to the queue, they should be processed in first-in-first-out order.

**Validates: Requirements 7.2**

### Property 25: Concurrent Upload Limits

*For any* platform, only one video upload for that platform should be in "processing" status at any given time.

**Validates: Requirements 7.3**

### Property 26: Queue Status Transitions

*For any* video in the queue, its status should transition from "queued" to "processing" when processing starts, then to either "completed" or "failed" when processing finishes.

**Validates: Requirements 7.4, 7.5, 7.6**

### Property 27: Queue Persistence

*For any* queue state, after a system restart, the queue should contain the same jobs with the same statuses as before the restart.

**Validates: Requirements 7.7**

### Property 28: Progress Bar Display

*For any* upload in progress, a progress bar should be displayed for each selected platform showing the current progress percentage.

**Validates: Requirements 8.1, 8.2**

### Property 29: Upload Completion Notifications

*For any* completed upload, a success notification should be displayed if successful, or an error notification with failure reason if failed.

**Validates: Requirements 8.3, 8.4**

### Property 30: Time Estimation Display

*For any* upload in progress, an estimated time remaining should be calculated and displayed.

**Validates: Requirements 8.5**

### Property 31: Multiple Upload Progress Tracking

*For any* set of concurrent uploads, the progress tracker should display progress information for all of them simultaneously.

**Validates: Requirements 8.6**

### Property 32: Upload Summary Notification

*For any* batch of uploads, when all uploads in the batch complete, a summary notification should be displayed.

**Validates: Requirements 8.7**

### Property 33: Multi-Platform Publication

*For any* video and set of selected platforms, the platform publisher should initiate upload to each selected platform.

**Validates: Requirements 9.1**

### Property 34: Metadata Inclusion in Upload

*For any* video upload, the request to the platform API should include the video's title, description, and tags.

**Validates: Requirements 9.2**

### Property 35: Platform Token Usage

*For any* platform upload, the publisher should use the access token associated with that specific platform.

**Validates: Requirements 9.3**

### Property 36: Successful Upload Response

*For any* successful upload to a platform API, the publisher should receive and store a video ID from that platform.

**Validates: Requirements 9.4, 9.5, 9.6, 9.7**

### Property 37: API Error Propagation

*For any* API error during upload, the error should be passed to the retry handler for processing.

**Validates: Requirements 9.8**

### Property 38: Rate Limit Tracking

*For any* API request to a platform, the rate limiter should increment the request count and record the timestamp for that platform.

**Validates: Requirements 10.1, 10.2**

### Property 39: Rate Limit Delay

*For any* platform approaching its rate limit, subsequent requests to that platform should be delayed to avoid exceeding the limit.

**Validates: Requirements 10.3, 10.4, 10.5, 10.6**

### Property 40: Rate Limit Exceeded Handling

*For any* request that would exceed a platform's rate limit, it should be queued for retry after the rate limit window resets.

**Validates: Requirements 10.7**

### Property 41: Rate Limit Status Display

*For any* platform, the current rate limit status (remaining requests, time until reset) should be displayed to the user.

**Validates: Requirements 10.8**

### Property 42: Network Error Retry

*For any* upload that fails with a network error, the retry handler should attempt up to 3 retries with exponential backoff (2s, 4s, 8s).

**Validates: Requirements 11.1, 11.2**

### Property 43: Authentication Error Handling

*For any* upload that fails with an authentication error, the retry handler should prompt for re-authentication instead of retrying.

**Validates: Requirements 11.3**

### Property 44: Rate Limit Error Handling

*For any* upload that fails with a rate limit error, the retry handler should wait until the rate limit resets before retrying.

**Validates: Requirements 11.4**

### Property 45: Permanent Failure Status

*For any* upload that fails all retry attempts, it should be marked with status "permanently failed".

**Validates: Requirements 11.5**

### Property 46: Retry Logging

*For any* retry attempt, a log entry should be created with timestamp, attempt number, and error details.

**Validates: Requirements 11.6**

### Property 47: Manual Retry

*For any* failed upload, the user should be able to manually trigger a retry.

**Validates: Requirements 11.7**

### Property 48: Publication History Display

*For any* user, the publication history should display all their published videos with title, publication date, target platforms, and status for each platform.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 49: History Filtering

*For any* publication history, filtering by platform should show only publications that included that platform, and filtering by date range should show only publications within that range.

**Validates: Requirements 12.4, 12.5**

### Property 50: History Sorting

*For any* publication history, sorting by publication date should order the entries chronologically (ascending or descending).

**Validates: Requirements 12.6**

### Property 51: Publication Detail View

*For any* publication entry, clicking it should display detailed information including all metadata and platform-specific results.

**Validates: Requirements 12.7**

### Property 52: Platform Video Links

*For any* successful publication to a platform, the history should display a direct link to the video on that platform.

**Validates: Requirements 12.8**

### Property 53: Comprehensive Audit Logging

*For any* critical operation (OAuth attempt, video upload, publication attempt, API error, token access), a log entry should be created with timestamp, user identifier, operation type, and relevant details.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 5.7**

### Property 54: Audit Log Immutability

*For any* audit log entry, once written, it should not be modifiable (append-only storage).

**Validates: Requirements 13.6**

### Property 55: Audit Log Retention

*For any* audit log entry, it should be retained for at least 90 days before being eligible for deletion.

**Validates: Requirements 13.7**

### Property 56: Language Selection

*For any* supported language (pt-BR, en, es, de), when selected, all interface text, error messages, and validation messages should be displayed in that language.

**Validates: Requirements 14.5, 14.6, 14.7**

### Property 57: Language Preference Persistence

*For any* language selection, the preference should be saved and restored across user sessions.

**Validates: Requirements 14.8**

### Property 58: Storage Usage Display

*For any* user, their current temporary storage usage should be calculated and displayed.

**Validates: Requirements 15.7**


## Error Handling

### Error Categories

#### 1. Validation Errors

Erros de validação ocorrem antes do upload e devem ser exibidos imediatamente ao usuário.

```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public platform?: Platform
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Examples:
// - File size exceeds platform limit
// - Invalid file format
// - Video duration outside platform range
// - Missing required metadata
// - No platforms selected
```

#### 2. Authentication Errors

Erros de autenticação requerem intervenção do usuário para re-autenticar.

```typescript
class AuthenticationError extends Error {
  constructor(
    public platform: Platform,
    public message: string,
    public requiresReauth: boolean = true
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Examples:
// - Token expired
// - Token revoked
// - Invalid token
// - Insufficient permissions
```

#### 3. Network Errors

Erros de rede são temporários e devem acionar retry automático.

```typescript
class NetworkError extends Error {
  constructor(
    public message: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Examples:
// - Connection timeout
// - DNS resolution failure
// - Socket error
// - Request timeout
```

#### 4. Rate Limit Errors

Erros de rate limit devem aguardar o reset do limite.

```typescript
class RateLimitError extends Error {
  constructor(
    public platform: Platform,
    public resetAt: Date,
    public message: string
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Examples:
// - Daily quota exceeded
// - Per-minute limit exceeded
// - Concurrent upload limit reached
```

#### 5. Platform API Errors

Erros específicos das APIs das plataformas.

```typescript
class PlatformAPIError extends Error {
  constructor(
    public platform: Platform,
    public statusCode: number,
    public errorCode: string,
    public message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PlatformAPIError';
  }
}

// Examples:
// - Invalid video format (platform-specific)
// - Copyright violation detected
// - Content policy violation
// - Service temporarily unavailable
```

### Error Handling Strategy

```typescript
class ErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<ErrorResolution> {
    // Log error
    await this.auditLogger.logError(context.userId, error, context);
    
    // Determine error type and resolution
    if (error instanceof ValidationError) {
      return {
        action: 'display',
        message: this.localizeError(error, context.locale),
        retryable: false,
      };
    }
    
    if (error instanceof AuthenticationError) {
      return {
        action: 'reauth',
        platform: error.platform,
        message: this.localizeError(error, context.locale),
        retryable: false,
      };
    }
    
    if (error instanceof NetworkError && error.retryable) {
      return {
        action: 'retry',
        maxAttempts: 3,
        backoff: 'exponential',
        message: this.localizeError(error, context.locale),
        retryable: true,
      };
    }
    
    if (error instanceof RateLimitError) {
      return {
        action: 'delay',
        delayUntil: error.resetAt,
        message: this.localizeError(error, context.locale),
        retryable: true,
      };
    }
    
    if (error instanceof PlatformAPIError) {
      if (error.retryable) {
        return {
          action: 'retry',
          maxAttempts: 3,
          backoff: 'exponential',
          message: this.localizeError(error, context.locale),
          retryable: true,
        };
      } else {
        return {
          action: 'fail',
          message: this.localizeError(error, context.locale),
          retryable: false,
        };
      }
    }
    
    // Unknown error - fail permanently
    return {
      action: 'fail',
      message: this.localizeError(error, context.locale),
      retryable: false,
    };
  }
  
  private localizeError(error: Error, locale: string): string {
    // Return localized error message based on error type and locale
  }
}

interface ErrorContext {
  userId: string;
  uploadId?: string;
  platform?: Platform;
  locale: string;
  operation: string;
}

interface ErrorResolution {
  action: 'display' | 'retry' | 'reauth' | 'delay' | 'fail';
  message: string;
  retryable: boolean;
  maxAttempts?: number;
  backoff?: 'exponential' | 'linear';
  delayUntil?: Date;
  platform?: Platform;
}
```

### User-Facing Error Messages

Todas as mensagens de erro devem ser:
- Claras e específicas sobre o problema
- Acionáveis (indicar o que o usuário pode fazer)
- Localizadas no idioma selecionado
- Não expor detalhes técnicos sensíveis

```typescript
const ERROR_MESSAGES = {
  'pt-BR': {
    'file.size.exceeded': 'O arquivo excede o tamanho máximo de {limit} para {platform}',
    'file.format.invalid': 'Formato de arquivo não suportado. Use MP4, MOV, AVI ou WMV',
    'file.duration.invalid': 'A duração do vídeo deve estar entre {min} e {max} para {platform}',
    'auth.token.expired': 'Sua sessão expirou. Por favor, reconecte sua conta {platform}',
    'network.timeout': 'Tempo de conexão esgotado. Tentando novamente...',
    'ratelimit.exceeded': 'Limite de requisições atingido. Aguardando até {resetTime}',
    'upload.failed': 'Falha no upload para {platform}: {reason}',
  },
  'en': {
    'file.size.exceeded': 'File exceeds maximum size of {limit} for {platform}',
    'file.format.invalid': 'Unsupported file format. Use MP4, MOV, AVI or WMV',
    'file.duration.invalid': 'Video duration must be between {min} and {max} for {platform}',
    'auth.token.expired': 'Your session expired. Please reconnect your {platform} account',
    'network.timeout': 'Connection timeout. Retrying...',
    'ratelimit.exceeded': 'Rate limit reached. Waiting until {resetTime}',
    'upload.failed': 'Upload failed for {platform}: {reason}',
  },
  // ... es, de
};
```


## Testing Strategy

### Dual Testing Approach

O sistema será testado usando uma combinação de testes unitários e testes baseados em propriedades (property-based testing). Ambos são complementares e necessários para cobertura abrangente:

- **Testes unitários**: Verificam exemplos específicos, casos extremos e condições de erro
- **Testes de propriedade**: Verificam propriedades universais através de todos os inputs

### Property-Based Testing Configuration

Para testes baseados em propriedades, utilizaremos a biblioteca **fast-check** (JavaScript/TypeScript), que é a biblioteca padrão para property-based testing no ecossistema Node.js.

Configuração:
- Mínimo de 100 iterações por teste de propriedade (devido à randomização)
- Cada teste deve referenciar a propriedade do documento de design
- Formato de tag: `Feature: video-upload-multi-platform, Property {number}: {property_text}`

### Unit Testing Focus

Os testes unitários devem focar em:

1. **Exemplos específicos**: Demonstrar comportamento correto com inputs conhecidos
2. **Casos extremos**: Testar limites e condições de borda
3. **Condições de erro**: Verificar tratamento de erros específicos
4. **Integração entre componentes**: Testar pontos de integração

Evitar escrever muitos testes unitários para cobrir variações de inputs - os testes de propriedade lidam com isso.

### Test Organization

```
src/
  __tests__/
    unit/
      services/
        VideoService.test.ts
        OAuthService.test.ts
        EncryptionService.test.ts
        QueueService.test.ts
        PlatformPublisher.test.ts
        RateLimiterService.test.ts
        RetryHandler.test.ts
        AuditLogger.test.ts
      api/
        upload.test.ts
        oauth.test.ts
        status.test.ts
        history.test.ts
      components/
        DragDropUploader.test.tsx
        MetadataEditor.test.tsx
        PlatformSelector.test.tsx
        ProgressTracker.test.tsx
        PublicationHistory.test.tsx
    property/
      upload-properties.test.ts
      validation-properties.test.ts
      oauth-properties.test.ts
      queue-properties.test.ts
      encryption-properties.test.ts
      ratelimit-properties.test.ts
      retry-properties.test.ts
      audit-properties.test.ts
    integration/
      upload-flow.test.ts
      oauth-flow.test.ts
      publication-flow.test.ts
```

### Example Property Test

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { EncryptionService } from '@/services/EncryptionService';

describe('Encryption Properties', () => {
  const encryptionService = new EncryptionService();
  
  it('Property 18: Token encryption round-trip - For any access token, encrypting it with AES-256 and then decrypting it should return the original token value', () => {
    // Feature: video-upload-multi-platform, Property 18: Token encryption round-trip
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }), // arbitrary token
        (token) => {
          const encrypted = encryptionService.encrypt(token);
          const decrypted = encryptionService.decrypt(encrypted);
          
          expect(decrypted).toBe(token);
          expect(encrypted).not.toBe(token); // ensure it was actually encrypted
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 2: Video format validation - For any video file, the validator should accept only files with formats MP4, MOV, AVI, or WMV', () => {
    // Feature: video-upload-multi-platform, Property 2: Video format validation
    
    const validFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
    const invalidFormats = ['video/webm', 'video/ogg', 'image/jpeg', 'application/pdf'];
    
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...validFormats),
          fc.constantFrom(...invalidFormats)
        ),
        (format) => {
          const result = videoValidator.validateFormat(format);
          
          if (validFormats.includes(format)) {
            expect(result.valid).toBe(true);
          } else {
            expect(result.valid).toBe(false);
            expect(result.error).toContain('MP4, MOV, AVI');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Example Unit Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetadataEditor } from '@/components/MetadataEditor';

describe('MetadataEditor Component', () => {
  it('should display input fields for title, description, and tags', () => {
    // Example test for Requirements 2.1, 2.2, 2.3
    
    render(<MetadataEditor metadata={{}} onChange={() => {}} locale="en" />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
  });
  
  it('should display warning when title exceeds 100 characters', () => {
    // Example test for Requirement 2.4
    
    const { rerender } = render(
      <MetadataEditor 
        metadata={{ title: 'a'.repeat(101) }} 
        onChange={() => {}} 
        locale="en" 
      />
    );
    
    expect(screen.getByText(/character limit/i)).toBeInTheDocument();
  });
  
  it('should handle empty state when no platforms are selected', () => {
    // Example test for Requirement 3.6
    
    render(<VideoUploadPage locale="en" />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from '@/test-utils/database';
import { VideoService } from '@/services/VideoService';
import { QueueService } from '@/services/QueueService';
import { PlatformPublisher } from '@/services/PlatformPublisher';

describe('Upload Flow Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  it('should complete full upload flow from file upload to publication', async () => {
    const videoService = new VideoService();
    const queueService = new QueueService();
    const publisher = new PlatformPublisher();
    
    // 1. Upload file
    const filePath = await videoService.saveTemporaryFile(mockFile, 'user-123');
    expect(filePath).toBeTruthy();
    
    // 2. Add to queue
    const jobId = await queueService.addJob({
      userId: 'user-123',
      filePath,
      metadata: { title: 'Test Video', description: 'Test', tags: [] },
      platforms: ['youtube'],
    });
    expect(jobId).toBeTruthy();
    
    // 3. Process job
    await queueService.processNextJob();
    
    // 4. Verify completion
    const job = await queueService.getJob(jobId);
    expect(job.status).toBe('completed');
    expect(job.platformStatuses.youtube.status).toBe('success');
    expect(job.platformStatuses.youtube.videoId).toBeTruthy();
    
    // 5. Verify cleanup
    const fileExists = await videoService.fileExists(filePath);
    expect(fileExists).toBe(false);
  });
});
```

### Test Coverage Goals

- **Unit tests**: 80%+ code coverage
- **Property tests**: 100% coverage of correctness properties
- **Integration tests**: All critical user flows
- **E2E tests**: Main happy paths and error scenarios

### Mocking Strategy

Para testes unitários e de propriedade, mockar:
- APIs externas (YouTube, Facebook, Instagram, TikTok)
- Sistema de arquivos (para uploads)
- Banco de dados (usar banco em memória ou mocks)
- Redis (usar redis-mock ou ioredis-mock)
- Serviços de criptografia (quando testar lógica de negócio)

Para testes de integração:
- Usar banco de dados de teste real
- Usar Redis de teste real
- Mockar apenas APIs externas

### Continuous Integration

Todos os testes devem ser executados em CI:
```bash
npm run test:all  # type-check + lint + format + spell-check + tests
```

Testes de propriedade devem ser executados com seed fixo em CI para reprodutibilidade:
```typescript
fc.assert(property, { seed: 42, numRuns: 100 });
```


## Security and Encryption

### Token Encryption

Todos os tokens OAuth são criptografados antes de serem armazenados no banco de dados.

```typescript
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits
  
  constructor(private encryptionKey: string) {
    // Derive key from environment variable
    this.key = crypto.scryptSync(encryptionKey, 'salt', this.keyLength);
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, encrypted] = ciphertext.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

### File Encryption at Rest

Arquivos temporários são criptografados no disco.

```typescript
class VideoService {
  async saveTemporaryFile(file: File, userId: string): Promise<string> {
    const fileId = crypto.randomUUID();
    const filePath = path.join(TEMP_DIR, userId, fileId);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Encrypt file content
    const fileBuffer = await file.arrayBuffer();
    const encryptedBuffer = this.encryptFile(Buffer.from(fileBuffer));
    
    // Write encrypted file
    await fs.writeFile(filePath, encryptedBuffer);
    
    return filePath;
  }
  
  private encryptFile(buffer: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.fileEncryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);
    
    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  }
  
  private decryptFile(buffer: Buffer): Buffer {
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.fileEncryptionKey, iv);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }
}
```

### Environment Variables

Variáveis de ambiente necessárias para segurança:

```bash
# Encryption keys (generate with: openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=<256-bit-hex-key>
FILE_ENCRYPTION_KEY=<256-bit-hex-key>

# OAuth credentials
YOUTUBE_CLIENT_ID=<youtube-client-id>
YOUTUBE_CLIENT_SECRET=<youtube-client-secret>

FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_SECRET=<facebook-app-secret>

INSTAGRAM_APP_ID=<instagram-app-id>
INSTAGRAM_APP_SECRET=<instagram-app-secret>

TIKTOK_CLIENT_KEY=<tiktok-client-key>
TIKTOK_CLIENT_SECRET=<tiktok-client-secret>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Application
APP_URL=https://yourdomain.com
NODE_ENV=production
```

### CSRF Protection

Proteção contra CSRF em fluxos OAuth:

```typescript
class OAuthService {
  async getAuthorizationUrl(platform: Platform, redirectUri: string): Promise<string> {
    // Generate CSRF token
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session or Redis with expiration
    await this.storeState(state, platform, 600); // 10 minutes
    
    const config = this.getOAuthConfig(platform);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code',
    });
    
    return `${config.authorizationEndpoint}?${params.toString()}`;
  }
  
  async validateCallback(code: string, state: string, platform: Platform): Promise<boolean> {
    // Verify state token
    const storedPlatform = await this.getState(state);
    
    if (!storedPlatform || storedPlatform !== platform) {
      throw new Error('Invalid state token - possible CSRF attack');
    }
    
    // Delete state after use
    await this.deleteState(state);
    
    return true;
  }
}
```

### Input Validation

Validação rigorosa de todos os inputs do usuário:

```typescript
import { z } from 'zod';

const VideoMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000),
  tags: z.array(z.string().max(50)).max(30),
});

const UploadRequestSchema = z.object({
  metadata: VideoMetadataSchema,
  platforms: z.array(z.enum(['youtube', 'facebook', 'instagram', 'tiktok'])).min(1),
});

// In API route
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = UploadRequestSchema.parse(body);
    
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}
```

### Rate Limiting

Rate limiting para proteger contra abuso:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// In API route
export async function POST(request: Request) {
  const userId = await getUserId(request);
  
  const { success, limit, reset, remaining } = await ratelimit.limit(userId);
  
  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded', reset },
      { status: 429 }
    );
  }
  
  // Process request
}
```

### Audit Trail

Todas as operações críticas são registradas:

```typescript
class AuditLogger {
  async logOAuthAttempt(userId: string, platform: Platform, success: boolean, error?: string) {
    await db.auditLogs.create({
      data: {
        userId,
        operation: 'oauth_attempt',
        platform,
        success,
        errorMessage: error,
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent(),
        metadata: { platform },
      },
    });
  }
  
  async logUpload(userId: string, fileMetadata: VideoFileMetadata) {
    await db.auditLogs.create({
      data: {
        userId,
        operation: 'upload',
        success: true,
        metadata: {
          fileSize: fileMetadata.size,
          fileType: fileMetadata.type,
          duration: fileMetadata.duration,
        },
      },
    });
  }
  
  async logPublication(userId: string, platform: Platform, success: boolean, error?: string) {
    await db.auditLogs.create({
      data: {
        userId,
        operation: 'publication',
        platform,
        success,
        errorMessage: error,
        metadata: { platform },
      },
    });
  }
}
```

### Secure File Handling

Práticas seguras para manipulação de arquivos:

```typescript
class VideoService {
  private readonly ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
  ];
  
  async validateFile(file: File): Promise<ValidationResult> {
    // 1. Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    // 2. Verify file signature (magic bytes)
    const buffer = await file.slice(0, 12).arrayBuffer();
    const signature = this.getFileSignature(Buffer.from(buffer));
    
    if (!this.isValidVideoSignature(signature)) {
      return { valid: false, error: 'File signature mismatch' };
    }
    
    // 3. Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large' };
    }
    
    // 4. Scan for malware (if applicable)
    // await this.scanForMalware(file);
    
    return { valid: true };
  }
  
  private getFileSignature(buffer: Buffer): string {
    return buffer.toString('hex', 0, 12);
  }
  
  private isValidVideoSignature(signature: string): boolean {
    const validSignatures = [
      '000000', // MP4
      '66747970', // MP4 ftyp
      '6d6f6f76', // MOV
      '52494646', // AVI (RIFF)
      '3026b275', // WMV
    ];
    
    return validSignatures.some(valid => signature.startsWith(valid));
  }
}
```


## Data Flow Diagrams

### Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant VideoService
    participant Queue
    participant Publisher
    participant Platform

    User->>UI: Drop/Select video file
    UI->>UI: Validate file (client-side)
    UI->>API: POST /api/video/validate
    API->>VideoService: validateVideo()
    VideoService-->>API: ValidationResult
    API-->>UI: Validation response
    
    User->>UI: Edit metadata
    User->>UI: Select platforms
    User->>UI: Click publish
    
    UI->>API: POST /api/video/upload
    API->>VideoService: saveTemporaryFile()
    VideoService-->>API: filePath
    API->>Queue: addJob()
    Queue-->>API: jobId
    API-->>UI: { uploadId, queuePosition }
    
    UI->>UI: Start progress polling
    
    loop Every 2 seconds
        UI->>API: GET /api/video/status/:uploadId
        API->>Queue: getJob()
        Queue-->>API: job status
        API-->>UI: progress update
    end
    
    Queue->>Publisher: processJob()
    
    loop For each platform
        Publisher->>Platform: Upload video
        Platform-->>Publisher: videoId
        Publisher->>Queue: updatePlatformStatus()
    end
    
    Publisher->>VideoService: deleteTemporaryFile()
    Publisher->>Queue: updateJobStatus('completed')
    
    UI->>API: GET /api/video/status/:uploadId
    API-->>UI: { status: 'completed' }
    UI->>User: Show success notification
```

### OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant OAuthService
    participant Platform
    participant TokenStore

    User->>UI: Click "Connect YouTube"
    UI->>API: POST /api/oauth/authorize
    API->>OAuthService: getAuthorizationUrl('youtube')
    OAuthService->>OAuthService: Generate CSRF state
    OAuthService->>OAuthService: Store state in Redis
    OAuthService-->>API: authUrl
    API-->>UI: { authUrl, state }
    
    UI->>Platform: Redirect to authUrl
    User->>Platform: Authorize application
    Platform->>API: Redirect to /api/oauth/callback?code=...&state=...
    
    API->>OAuthService: validateCallback(code, state)
    OAuthService->>OAuthService: Verify state token
    OAuthService->>Platform: Exchange code for token
    Platform-->>OAuthService: { accessToken, refreshToken, expiresIn }
    
    OAuthService->>TokenStore: encrypt(accessToken)
    TokenStore-->>OAuthService: encryptedToken
    OAuthService->>API: Save to database
    
    API->>UI: Redirect to success page
    UI->>User: Show "Connected successfully"
```

### Queue Processing Flow

```mermaid
flowchart TD
    A[Job Added to Queue] --> B{Check Platform Concurrency}
    B -->|Slot Available| C[Update Status: Processing]
    B -->|Slot Full| D[Wait in Queue]
    D --> B
    
    C --> E[Get Access Token]
    E --> F{Token Valid?}
    F -->|No| G[Prompt Re-auth]
    F -->|Yes| H[Check Rate Limit]
    
    H --> I{Within Limit?}
    I -->|No| J[Delay Until Reset]
    J --> H
    I -->|Yes| K[Upload to Platform]
    
    K --> L{Upload Success?}
    L -->|Yes| M[Update Status: Success]
    L -->|No| N{Error Type?}
    
    N -->|Network| O{Retry Count < 3?}
    N -->|Auth| G
    N -->|Rate Limit| J
    N -->|Other| P[Update Status: Failed]
    
    O -->|Yes| Q[Exponential Backoff]
    O -->|No| P
    Q --> K
    
    M --> R[Delete Temp File]
    R --> S[Update Job: Completed]
    
    P --> T[Log Error]
    T --> U[Update Job: Failed]
```

### Rate Limiting Flow

```mermaid
flowchart TD
    A[API Request] --> B[Get User ID]
    B --> C[Check Rate Limit]
    C --> D{Within Limit?}
    
    D -->|Yes| E[Increment Counter]
    E --> F[Process Request]
    F --> G[Return Response]
    
    D -->|No| H[Calculate Reset Time]
    H --> I[Return 429 Error]
    I --> J[Include Retry-After Header]
    
    G --> K[Update Platform Rate Limit]
    K --> L{Approaching Limit?}
    L -->|Yes| M[Add Delay to Next Request]
    L -->|No| N[Continue Normal Processing]
```


## Implementation Considerations

### File Storage Strategy

Para armazenamento temporário de vídeos, considerar:

**Opção 1: Local Filesystem (Desenvolvimento/Pequena Escala)**
```typescript
const TEMP_DIR = path.join(process.cwd(), 'temp', 'uploads');

// Pros: Simples, sem custos adicionais
// Cons: Não escala horizontalmente, requer limpeza manual
```

**Opção 2: Cloud Storage (Produção/Grande Escala)**
```typescript
// AWS S3, Google Cloud Storage, Azure Blob Storage
const TEMP_BUCKET = 'video-uploads-temp';

// Pros: Escala automaticamente, lifecycle policies para limpeza
// Cons: Custos de armazenamento e transferência
```

Recomendação: Usar filesystem local para desenvolvimento e cloud storage para produção.

### Queue Implementation

**Opção 1: Redis + Bull/BullMQ**
```typescript
import { Queue, Worker } from 'bullmq';

const uploadQueue = new Queue('video-uploads', {
  connection: { host: 'localhost', port: 6379 }
});

const worker = new Worker('video-uploads', async (job) => {
  await processUpload(job.data);
}, {
  connection: { host: 'localhost', port: 6379 }
});
```

**Opção 2: Database-backed Queue**
```typescript
// Use PostgreSQL with pg-boss or similar
// Pros: Simples, sem dependência adicional
// Cons: Menos performático que Redis
```

Recomendação: Usar BullMQ com Redis para melhor performance e features (retry, delay, priority).

### Real-time Progress Updates

**Opção 1: Polling (Simples)**
```typescript
// Client polls every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetch(`/api/video/status/${uploadId}`);
    setProgress(await status.json());
  }, 2000);
  
  return () => clearInterval(interval);
}, [uploadId]);
```

**Opção 2: Server-Sent Events (Melhor UX)**
```typescript
// Server
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        const status = await getUploadStatus(uploadId);
        controller.enqueue(`data: ${JSON.stringify(status)}\n\n`);
        
        if (status.completed) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client
const eventSource = new EventSource(`/api/video/status/${uploadId}/stream`);
eventSource.onmessage = (event) => {
  const status = JSON.parse(event.data);
  setProgress(status);
};
```

**Opção 3: WebSockets (Mais Complexo)**
```typescript
// Requer servidor WebSocket separado ou Socket.io
// Pros: Bidirecional, baixa latência
// Cons: Mais complexo, requer infraestrutura adicional
```

Recomendação: Começar com polling, migrar para SSE se necessário.

### Database Indexing Strategy

Índices críticos para performance:

```sql
-- Queries frequentes por usuário
CREATE INDEX idx_video_uploads_user_created ON video_uploads(user_id, created_at DESC);
CREATE INDEX idx_platform_tokens_user_platform ON platform_tokens(user_id, platform);

-- Queries de status
CREATE INDEX idx_video_uploads_status_created ON video_uploads(status, created_at DESC);
CREATE INDEX idx_platform_publications_status ON platform_publications(status);

-- Cleanup queries
CREATE INDEX idx_video_uploads_created_status ON video_uploads(created_at, status);
CREATE INDEX idx_platform_tokens_expires ON platform_tokens(expires_at);

-- Audit queries
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_operation_created ON audit_logs(operation, created_at DESC);
```

### Internationalization (i18n)

Usar next-intl para internacionalização:

```typescript
// messages/pt-BR.json
{
  "upload": {
    "title": "Upload de Vídeo",
    "dragDrop": "Arraste e solte seu vídeo aqui",
    "selectFile": "ou selecione um arquivo",
    "processing": "Processando...",
    "success": "Upload concluído com sucesso!",
    "errors": {
      "fileSize": "O arquivo excede o tamanho máximo de {limit}",
      "fileFormat": "Formato não suportado. Use MP4, MOV, AVI ou WMV",
      "networkError": "Erro de rede. Tentando novamente..."
    }
  }
}

// Component
import { useTranslations } from 'next-intl';

export function UploadPage() {
  const t = useTranslations('upload');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('dragDrop')}</p>
    </div>
  );
}
```

### Performance Optimization

1. **Chunked Upload**: Dividir arquivos grandes em chunks para upload mais confiável
2. **Lazy Loading**: Carregar componentes pesados sob demanda
3. **Image Optimization**: Usar next/image para thumbnails
4. **Code Splitting**: Separar código por rota
5. **Caching**: Cache de tokens, rate limits, e metadados
6. **Database Connection Pooling**: Usar pool de conexões PostgreSQL
7. **Redis Caching**: Cache de dados frequentemente acessados

### Monitoring and Observability

Métricas importantes para monitorar:

```typescript
// Métricas de negócio
- Total de uploads por dia/semana/mês
- Taxa de sucesso por plataforma
- Tempo médio de upload
- Tamanho médio de arquivo
- Plataformas mais populares

// Métricas técnicas
- Taxa de erro por endpoint
- Latência de API
- Uso de fila (tamanho, tempo de espera)
- Taxa de retry
- Uso de rate limit

// Métricas de infraestrutura
- Uso de CPU/memória
- Uso de disco (temp storage)
- Conexões de banco de dados
- Conexões Redis
```

Ferramentas recomendadas:
- **Logging**: Winston ou Pino
- **APM**: Vercel Analytics, Sentry
- **Metrics**: Prometheus + Grafana
- **Alerting**: PagerDuty, Opsgenie

### Deployment Considerations

**Vercel Deployment**:
```json
// vercel.json
{
  "functions": {
    "api/video/upload.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  },
  "env": {
    "TOKEN_ENCRYPTION_KEY": "@token-encryption-key",
    "FILE_ENCRYPTION_KEY": "@file-encryption-key"
  }
}
```

**Environment-specific Configuration**:
```typescript
const config = {
  development: {
    tempStorage: 'filesystem',
    queueProvider: 'memory',
    logLevel: 'debug',
  },
  production: {
    tempStorage: 's3',
    queueProvider: 'redis',
    logLevel: 'info',
  },
};

export default config[process.env.NODE_ENV];
```

### Scalability Considerations

Para escalar o sistema:

1. **Horizontal Scaling**: Múltiplas instâncias da aplicação
2. **Queue Workers**: Workers dedicados para processamento
3. **Database Replication**: Read replicas para queries pesadas
4. **CDN**: Servir assets estáticos via CDN
5. **Load Balancing**: Distribuir carga entre instâncias
6. **Caching Layer**: Redis para cache distribuído
7. **Object Storage**: S3 ou similar para arquivos

### Migration Strategy

Para migração de dados existentes:

```typescript
// migrations/001_initial_schema.sql
-- Create tables in order of dependencies

// migrations/002_add_indexes.sql
-- Add performance indexes

// migrations/003_add_audit_logs.sql
-- Add audit logging tables
```

Usar ferramenta de migração como:
- **node-pg-migrate**
- **Prisma Migrate**
- **Knex.js**

### Backup and Recovery

Estratégia de backup:

1. **Database**: Backup diário automático com retenção de 30 dias
2. **Temporary Files**: Não fazer backup (são temporários)
3. **Audit Logs**: Backup semanal com retenção de 1 ano
4. **Configuration**: Versionado no Git

Recovery Time Objective (RTO): < 1 hora
Recovery Point Objective (RPO): < 24 horas


## Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "next": "^16.1.5",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "pg": "^8.18.0",
    "ioredis": "^5.9.2",
    "bullmq": "^5.0.0",
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.36.1",
    "next-intl": "^4.7.0",
    "zod": "^3.22.4",
    "axios": "^1.6.0",
    "form-data": "^4.0.0",
    "mime-types": "^2.1.35"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^25.0.10",
    "@types/react": "^19.2.10",
    "@types/pg": "^8.10.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.18",
    "@vitest/coverage-v8": "^4.0.18",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "fast-check": "^3.15.0",
    "msw": "^2.0.0"
  }
}
```

### External APIs

- **YouTube Data API v3**: https://developers.google.com/youtube/v3
- **Facebook Graph API**: https://developers.facebook.com/docs/graph-api
- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api
- **TikTok API for Developers**: https://developers.tiktok.com/

### Required Accounts

Para desenvolvimento e produção, será necessário criar:

1. **Google Cloud Console**: Para YouTube API credentials
2. **Meta for Developers**: Para Facebook e Instagram API credentials
3. **TikTok for Developers**: Para TikTok API credentials
4. **PostgreSQL Database**: Heroku, Supabase, ou similar
5. **Redis Instance**: Upstash, Redis Cloud, ou similar
6. **Object Storage** (opcional): AWS S3, Cloudflare R2, ou similar

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── video-upload/
│   │   │   ├── page.tsx                 # Main upload page
│   │   │   ├── history/
│   │   │   │   └── page.tsx             # Publication history page
│   │   │   └── layout.tsx
│   ├── api/
│   │   ├── video/
│   │   │   ├── upload/
│   │   │   │   └── route.ts             # POST /api/video/upload
│   │   │   ├── validate/
│   │   │   │   └── route.ts             # POST /api/video/validate
│   │   │   ├── status/
│   │   │   │   └── [uploadId]/
│   │   │   │       └── route.ts         # GET /api/video/status/:uploadId
│   │   │   ├── retry/
│   │   │   │   └── [uploadId]/
│   │   │   │       └── route.ts         # POST /api/video/retry/:uploadId
│   │   │   └── history/
│   │   │       └── route.ts             # GET /api/video/history
│   │   └── oauth/
│   │       ├── authorize/
│   │       │   └── route.ts             # POST /api/oauth/authorize
│   │       ├── callback/
│   │       │   └── route.ts             # GET /api/oauth/callback
│   │       ├── disconnect/
│   │       │   └── route.ts             # DELETE /api/oauth/disconnect
│   │       └── status/
│   │           └── route.ts             # GET /api/oauth/status
├── components/
│   ├── video-upload/
│   │   ├── DragDropUploader.tsx
│   │   ├── MetadataEditor.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── PublicationHistory.tsx
│   │   └── OAuthConnectButton.tsx
├── services/
│   ├── VideoService.ts
│   ├── OAuthService.ts
│   ├── EncryptionService.ts
│   ├── QueueService.ts
│   ├── PlatformPublisher.ts
│   ├── RateLimiterService.ts
│   ├── RetryHandler.ts
│   └── AuditLogger.ts
├── lib/
│   ├── db.ts                            # Database client
│   ├── redis.ts                         # Redis client
│   ├── platforms/
│   │   ├── youtube.ts
│   │   ├── facebook.ts
│   │   ├── instagram.ts
│   │   └── tiktok.ts
│   └── validation.ts                    # Zod schemas
├── types/
│   ├── video.ts
│   ├── oauth.ts
│   ├── queue.ts
│   └── platform.ts
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   ├── api/
│   │   └── components/
│   ├── property/
│   │   ├── upload-properties.test.ts
│   │   ├── validation-properties.test.ts
│   │   ├── oauth-properties.test.ts
│   │   ├── queue-properties.test.ts
│   │   ├── encryption-properties.test.ts
│   │   └── audit-properties.test.ts
│   └── integration/
│       ├── upload-flow.test.ts
│       ├── oauth-flow.test.ts
│       └── publication-flow.test.ts
└── messages/
    ├── pt-BR.json
    ├── en.json
    ├── es.json
    └── de.json
```

## Next Steps

Após aprovação deste design, os próximos passos são:

1. **Criar tasks detalhadas** para implementação
2. **Configurar ambiente de desenvolvimento** com credenciais de API
3. **Implementar schema do banco de dados** e migrations
4. **Desenvolver serviços core** (Encryption, OAuth, Video)
5. **Implementar API routes** seguindo o design
6. **Desenvolver componentes React** para a interface
7. **Escrever testes** (unit, property, integration)
8. **Configurar CI/CD** para deployment automático
9. **Realizar testes de integração** com APIs reais
10. **Deploy em staging** para testes finais
11. **Deploy em produção** com monitoramento

## Conclusion

Este design técnico fornece uma arquitetura completa e escalável para o módulo de upload de vídeos multi-plataforma. O sistema é construído com segurança, confiabilidade e experiência do usuário como prioridades principais.

Principais destaques do design:

- **Segurança robusta**: Criptografia AES-256 para tokens e arquivos, proteção CSRF, validação rigorosa de inputs
- **Confiabilidade**: Retry logic com exponential backoff, gerenciamento de rate limits, fila persistente
- **Escalabilidade**: Arquitetura em camadas, processamento assíncrono, suporte para múltiplas instâncias
- **Testabilidade**: 58 propriedades de correção, estratégia de testes dual (unit + property-based)
- **Observabilidade**: Audit logs completos, métricas de negócio e técnicas, rastreamento de erros
- **Experiência do usuário**: Feedback em tempo real, suporte multi-idioma, interface intuitiva

O sistema está pronto para ser implementado seguindo as especificações deste documento.

