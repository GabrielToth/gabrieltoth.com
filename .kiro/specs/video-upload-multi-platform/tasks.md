# Implementation Plan: Video Upload Multi-Platform

## Overview

Este plano de implementação detalha as tarefas para construir um módulo completo de upload de vídeos multi-plataforma usando Next.js 16, React 19, TypeScript e PostgreSQL. O sistema permite upload, edição de metadados e publicação simultânea em YouTube, Facebook, Instagram e TikTok, com autenticação OAuth, processamento em fila, e feedback em tempo real.

## Tasks

- [ ] 1. Setup inicial do projeto e infraestrutura
  - Configurar variáveis de ambiente (.env.local)
  - Criar schema do banco de dados PostgreSQL
  - Configurar cliente Redis/Upstash
  - Instalar dependências necessárias
  - _Requirements: 15.1, 15.2, 5.1, 7.7_

- [ ] 2. Implementar serviços de segurança e criptografia
  - [ ] 2.1 Criar EncryptionService com AES-256-GCM
    - Implementar métodos encrypt(), decrypt() e hash()
    - Gerar chaves de criptografia a partir de variáveis de ambiente
    - _Requirements: 5.1, 4.7, 15.5_
  
  - [ ]* 2.2 Escrever testes de propriedade para EncryptionService
    - **Property 18: Token encryption round-trip**
    - **Validates: Requirements 5.1, 4.7, 5.4**

- [ ] 3. Implementar serviços OAuth
  - [ ] 3.1 Criar OAuthService base
    - Implementar getAuthorizationUrl() para todas as plataformas
    - Implementar exchangeCodeForToken() com suporte a YouTube, Facebook, Instagram, TikTok
    - Implementar validateToken() e refreshToken()
    - Adicionar proteção CSRF com geração e validação de state tokens
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.9_
  
  - [ ]* 3.2 Escrever testes de propriedade para OAuth
    - **Property 15: OAuth authorization URL generation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  
  - [ ]* 3.3 Escrever testes unitários para OAuth error handling
    - Testar falhas de autenticação
    - Testar expiração de tokens
    - _Requirements: 4.6, 4.9_


- [ ] 4. Implementar gerenciamento de tokens
  - [ ] 4.1 Criar TokenStore com criptografia
    - Implementar saveToken() com criptografia AES-256
    - Implementar getToken() com descriptografia
    - Implementar deleteToken() e checkExpiration()
    - Criar tabela platform_tokens no banco de dados
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 4.2 Escrever testes de propriedade para TokenStore
    - **Property 19: Platform disconnection**
    - **Property 20: Token expiration handling**
    - **Property 21: Token user association**
    - **Validates: Requirements 5.2, 5.5, 5.6, 4.8, 4.9_

- [ ] 5. Implementar VideoService
  - [ ] 5.1 Criar VideoService com validação e armazenamento
    - Implementar saveTemporaryFile() com criptografia de arquivo
    - Implementar validateVideo() com regras por plataforma
    - Implementar getVideoMetadata() para extrair duração e formato
    - Implementar deleteTemporaryFile() e cleanupOldFiles()
    - _Requirements: 1.4, 1.5, 1.7, 1.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 15.1, 15.3, 15.4, 15.5, 15.6_
  
  - [ ]* 5.2 Escrever testes de propriedade para validação de vídeos
    - **Property 2: Video format validation**
    - **Property 3: Platform-specific size validation**
    - **Property 4: Platform-specific duration validation**
    - **Validates: Requirements 1.4, 1.6, 6.1-6.8**
  
  - [ ]* 5.3 Escrever testes de propriedade para armazenamento temporário
    - **Property 5: Temporary storage persistence**
    - **Property 6: Temporary file encryption**
    - **Property 7: Upload cancellation cleanup**
    - **Validates: Requirements 15.1-15.6**

- [ ] 6. Implementar QueueService com Redis
  - [ ] 6.1 Criar QueueService usando BullMQ
    - Implementar addJob() para adicionar vídeos à fila
    - Implementar getJob() e updateJobStatus()
    - Implementar processNextJob() com lógica FIFO
    - Configurar persistência de fila com Redis
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 6.2 Escrever testes de propriedade para fila
    - **Property 23: Queue addition**
    - **Property 24: FIFO queue processing**
    - **Property 25: Concurrent upload limits**
    - **Property 26: Queue status transitions**
    - **Property 27: Queue persistence**
    - **Validates: Requirements 7.1-7.7**

- [ ] 7. Checkpoint - Verificar serviços base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implementar RateLimiterService
  - [ ] 8.1 Criar RateLimiterService com Redis
    - Implementar checkLimit() para cada plataforma
    - Implementar recordRequest() com timestamps
    - Implementar getTimeUntilReset() e getRemainingRequests()
    - Configurar limites por plataforma (YouTube: 10000, Facebook: 200, Instagram: 200, TikTok: 100)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ]* 8.2 Escrever testes de propriedade para rate limiting
    - **Property 38: Rate limit tracking**
    - **Property 39: Rate limit delay**
    - **Property 40: Rate limit exceeded handling**
    - **Validates: Requirements 10.1-10.7**

- [ ] 9. Implementar RetryHandler
  - [ ] 9.1 Criar RetryHandler com exponential backoff
    - Implementar retry() com máximo de 3 tentativas
    - Implementar calculateBackoff() com delays de 2s, 4s, 8s
    - Adicionar lógica para diferentes tipos de erro (network, auth, rate limit)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 9.2 Escrever testes de propriedade para retry logic
    - **Property 42: Network error retry**
    - **Property 43: Authentication error handling**
    - **Property 44: Rate limit error handling**
    - **Property 45: Permanent failure status**
    - **Validates: Requirements 11.1-11.5**

- [ ] 10. Implementar PlatformPublisher
  - [ ] 10.1 Criar YouTubePublisher
    - Implementar uploadVideo() com YouTube Data API v3
    - Implementar upload resumível com chunks
    - Adicionar tratamento de erros específicos do YouTube
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 10.2 Criar FacebookPublisher
    - Implementar uploadVideo() com Facebook Graph API
    - Implementar upload em fases (start, transfer, finish)
    - Adicionar tratamento de erros específicos do Facebook
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [ ] 10.3 Criar InstagramPublisher
    - Implementar uploadVideo() com Instagram Graph API
    - Implementar criação de media container e publicação
    - Adicionar tratamento de erros específicos do Instagram
    - _Requirements: 9.1, 9.2, 9.3, 9.6_
  
  - [ ] 10.4 Criar TikTokPublisher
    - Implementar uploadVideo() com TikTok API
    - Implementar fluxo de init, upload e confirm
    - Adicionar tratamento de erros específicos do TikTok
    - _Requirements: 9.1, 9.2, 9.3, 9.7_
  
  - [ ]* 10.5 Escrever testes de propriedade para publicação
    - **Property 33: Multi-platform publication**
    - **Property 34: Metadata inclusion in upload**
    - **Property 35: Platform token usage**
    - **Property 36: Successful upload response**
    - **Property 37: API error propagation**
    - **Validates: Requirements 9.1-9.8**

- [ ] 11. Implementar AuditLogger
  - [ ] 11.1 Criar AuditLogger com PostgreSQL
    - Implementar logOAuthAttempt(), logUpload(), logPublication()
    - Implementar logTokenAccess() e logError()
    - Criar tabela audit_logs com índices apropriados
    - Configurar retenção de 90 dias
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 5.7_
  
  - [ ]* 11.2 Escrever testes de propriedade para audit logging
    - **Property 53: Comprehensive audit logging**
    - **Property 54: Audit log immutability**
    - **Property 55: Audit log retention**
    - **Validates: Requirements 13.1-13.7, 5.7**

- [ ] 12. Checkpoint - Verificar todos os serviços
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 13. Implementar API routes - OAuth
  - [ ] 13.1 Criar POST /api/oauth/authorize
    - Implementar endpoint para iniciar fluxo OAuth
    - Gerar URL de autorização com state token CSRF
    - Retornar authUrl e state
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 13.2 Criar GET /api/oauth/callback
    - Implementar callback OAuth com validação de state
    - Trocar code por access token
    - Salvar token criptografado no banco de dados
    - _Requirements: 4.5, 4.7_
  
  - [ ] 13.3 Criar DELETE /api/oauth/disconnect
    - Implementar desconexão de plataforma
    - Deletar tokens do banco de dados
    - _Requirements: 4.8, 5.6_
  
  - [ ] 13.4 Criar GET /api/oauth/status
    - Implementar endpoint para verificar status de autenticação
    - Retornar status para todas as plataformas
    - _Requirements: 3.3_
  
  - [ ]* 13.5 Escrever testes unitários para API OAuth
    - Testar fluxo completo de autorização
    - Testar validação de state token
    - Testar desconexão de plataforma
    - _Requirements: 4.1-4.9_

- [ ] 14. Implementar API routes - Video
  - [ ] 14.1 Criar POST /api/video/validate
    - Implementar validação de vídeo antes do upload
    - Validar formato, tamanho e duração por plataforma
    - Retornar erros de validação específicos
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 6.1-6.8_
  
  - [ ] 14.2 Criar POST /api/video/upload
    - Implementar upload de arquivo com FormData
    - Salvar arquivo temporário criptografado
    - Adicionar job à fila de processamento
    - Retornar uploadId e posição na fila
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 7.1, 15.1, 15.5_
  
  - [ ] 14.3 Criar GET /api/video/status/:uploadId
    - Implementar endpoint para obter status de upload
    - Retornar progresso por plataforma
    - Incluir estimativa de tempo restante
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 14.4 Criar POST /api/video/retry/:uploadId
    - Implementar retry manual de uploads falhados
    - Permitir retry de plataformas específicas
    - _Requirements: 11.7_
  
  - [ ] 14.5 Criar GET /api/video/history
    - Implementar endpoint de histórico com filtros
    - Suportar filtros por plataforma e data
    - Suportar ordenação e paginação
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ]* 14.6 Escrever testes unitários para API Video
    - Testar validação de vídeo
    - Testar upload e criação de job
    - Testar consulta de status
    - Testar histórico com filtros
    - _Requirements: 1.1-1.8, 7.1, 12.1-12.6_

- [ ] 15. Implementar componentes React - Upload
  - [ ] 15.1 Criar DragDropUploader component
    - Implementar drag & drop de arquivos
    - Implementar seleção via file browser
    - Exibir nome e tamanho do arquivo
    - Adicionar validação client-side
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 15.2 Criar MetadataEditor component
    - Implementar campos de título, descrição e tags
    - Adicionar contadores de caracteres com warnings
    - Suportar entrada multi-idioma
    - Validar limites (título: 100, descrição: 5000)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_
  
  - [ ] 15.3 Criar PlatformSelector component
    - Implementar checkboxes para YouTube, Facebook, Instagram, TikTok
    - Exibir status de autenticação por plataforma
    - Mostrar requisitos específicos de cada plataforma
    - Desabilitar botão de publicação se nenhuma plataforma selecionada
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 15.4 Escrever testes unitários para componentes de upload
    - Testar drag & drop e file selection
    - Testar validação de metadados
    - Testar seleção de plataformas
    - _Requirements: 1.1-1.3, 2.1-2.6, 3.1-3.6_

- [ ] 16. Implementar componentes React - Progress e OAuth
  - [ ] 16.1 Criar ProgressTracker component
    - Implementar progress bars por plataforma
    - Adicionar polling de status a cada 2 segundos
    - Exibir notificações de sucesso/erro
    - Mostrar estimativa de tempo restante
    - Exibir resumo quando todos os uploads completarem
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ] 16.2 Criar OAuthConnectButton component
    - Implementar botão de conexão OAuth
    - Exibir status de conexão
    - Adicionar botão de desconexão
    - _Requirements: 3.3, 3.4, 4.8_
  
  - [ ]* 16.3 Escrever testes de propriedade para progress tracking
    - **Property 28: Progress bar display**
    - **Property 29: Upload completion notifications**
    - **Property 30: Time estimation display**
    - **Property 31: Multiple upload progress tracking**
    - **Property 32: Upload summary notification**
    - **Validates: Requirements 8.1-8.7**

- [ ] 17. Implementar componentes React - History
  - [ ] 17.1 Criar PublicationHistory component
    - Implementar lista de publicações com título, data e plataformas
    - Adicionar filtros por plataforma e data
    - Implementar ordenação por data
    - Exibir detalhes ao clicar em publicação
    - Mostrar links diretos para vídeos nas plataformas
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_
  
  - [ ]* 17.2 Escrever testes de propriedade para histórico
    - **Property 48: Publication history display**
    - **Property 49: History filtering**
    - **Property 50: History sorting**
    - **Property 51: Publication detail view**
    - **Property 52: Platform video links**
    - **Validates: Requirements 12.1-12.8**

- [ ] 18. Implementar página principal VideoUploadPage
  - [ ] 18.1 Criar VideoUploadPage component
    - Integrar DragDropUploader, MetadataEditor e PlatformSelector
    - Implementar fluxo completo de upload
    - Adicionar gerenciamento de estado (file, metadata, platforms, status)
    - Integrar ProgressTracker para feedback em tempo real
    - _Requirements: 1.1-1.8, 2.1-2.8, 3.1-3.6, 8.1-8.7_
  
  - [ ]* 18.2 Escrever testes de integração para fluxo de upload
    - Testar fluxo completo: seleção → validação → upload → progresso → conclusão
    - Testar cancelamento de upload
    - Testar tratamento de erros
    - _Requirements: 1.1-1.8, 7.1-7.7, 8.1-8.7, 15.6_

- [ ] 19. Checkpoint - Verificar interface completa
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Implementar internacionalização (i18n)
  - [ ] 20.1 Configurar next-intl
    - Criar arquivos de mensagens para pt-BR, en, es, de
    - Configurar middleware de locale
    - Adicionar traduções para todos os componentes
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 20.2 Implementar seleção e persistência de idioma
    - Adicionar seletor de idioma na interface
    - Persistir preferência de idioma em localStorage/cookies
    - Aplicar idioma em mensagens de erro e validação
    - _Requirements: 14.5, 14.6, 14.7, 14.8_
  
  - [ ]* 20.3 Escrever testes de propriedade para i18n
    - **Property 56: Language selection**
    - **Property 57: Language preference persistence**
    - **Validates: Requirements 14.5-14.8**

- [ ] 21. Implementar worker de processamento de fila
  - [ ] 21.1 Criar queue worker com BullMQ
    - Implementar processamento assíncrono de jobs
    - Integrar PlatformPublisher para cada plataforma
    - Adicionar atualização de progresso em tempo real
    - Implementar limpeza de arquivos temporários após conclusão
    - Integrar RetryHandler para falhas
    - Integrar RateLimiterService para respeitar limites
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 9.1-9.8, 10.1-10.8, 11.1-11.7_
  
  - [ ]* 21.2 Escrever testes de integração para worker
    - Testar processamento completo de job
    - Testar retry em caso de falha
    - Testar rate limiting
    - Testar limpeza de arquivos
    - _Requirements: 7.1-7.7, 9.1-9.8, 11.1-11.7_

- [ ] 22. Implementar tratamento de erros e validação
  - [ ] 22.1 Criar ErrorHandler centralizado
    - Implementar handleError() com classificação de erros
    - Adicionar localização de mensagens de erro
    - Implementar estratégias de resolução por tipo de erro
    - _Requirements: 1.6, 1.7, 4.6, 6.8, 11.1-11.7_
  
  - [ ] 22.2 Criar schemas de validação com Zod
    - Criar VideoMetadataSchema
    - Criar UploadRequestSchema
    - Criar OAuthRequestSchema
    - Adicionar validação em todos os API endpoints
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ]* 22.3 Escrever testes unitários para error handling
    - Testar classificação de erros
    - Testar localização de mensagens
    - Testar validação de schemas
    - _Requirements: 1.6, 1.7, 4.6, 11.1-11.7_

- [ ] 23. Implementar migrations do banco de dados
  - [ ] 23.1 Criar migration inicial
    - Criar tabela users
    - Criar tabela platform_tokens com índices
    - Criar tabela video_uploads com índices
    - Criar tabela platform_publications com índices
    - Criar tabela audit_logs com índices
    - Criar tabela rate_limits com índices
    - _Requirements: 5.1-5.7, 7.1-7.7, 12.1-12.8, 13.1-13.7_
  
  - [ ]* 23.2 Escrever testes de integração para database
    - Testar criação e consulta de tokens
    - Testar criação e consulta de uploads
    - Testar criação e consulta de audit logs
    - _Requirements: 5.1-5.7, 12.1-12.8, 13.1-13.7_

- [ ] 24. Implementar features de segurança
  - [ ] 24.1 Adicionar rate limiting em API routes
    - Configurar @upstash/ratelimit
    - Adicionar rate limiting em todos os endpoints
    - Retornar 429 com Retry-After header
    - _Requirements: 10.1-10.8_
  
  - [ ] 24.2 Adicionar validação de file signatures
    - Implementar verificação de magic bytes
    - Validar que MIME type corresponde ao conteúdo real
    - _Requirements: 1.4, 6.5_
  
  - [ ] 24.3 Implementar CSRF protection para OAuth
    - Gerar e validar state tokens
    - Armazenar state em Redis com expiração
    - _Requirements: 4.1-4.5_
  
  - [ ]* 24.4 Escrever testes de segurança
    - Testar rate limiting
    - Testar validação de file signatures
    - Testar proteção CSRF
    - _Requirements: 1.4, 4.1-4.5, 10.1-10.8_

- [ ] 25. Implementar monitoramento e observabilidade
  - [ ] 25.1 Configurar logging estruturado
    - Configurar Winston ou Pino
    - Adicionar logs em pontos críticos
    - Incluir context (userId, uploadId, platform) em logs
    - _Requirements: 13.1-13.7_
  
  - [ ] 25.2 Adicionar métricas de negócio
    - Rastrear total de uploads por plataforma
    - Rastrear taxa de sucesso/falha
    - Rastrear tempo médio de upload
    - _Requirements: 12.1-12.8_

- [ ] 26. Checkpoint - Verificar sistema completo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Criar documentação de setup de APIs
  - [ ] 27.1 Documentar setup do YouTube API
    - Criar guia para obter credenciais do Google Cloud Console
    - Documentar configuração de OAuth consent screen
    - Listar scopes necessários
  
  - [ ] 27.2 Documentar setup do Facebook/Instagram API
    - Criar guia para obter credenciais do Meta for Developers
    - Documentar configuração de app permissions
    - Listar scopes necessários
  
  - [ ] 27.3 Documentar setup do TikTok API
    - Criar guia para obter credenciais do TikTok for Developers
    - Documentar processo de aprovação de app
    - Listar scopes necessários
  
  - [ ] 27.4 Criar guia de configuração de ambiente
    - Documentar todas as variáveis de ambiente necessárias
    - Criar template .env.example
    - Documentar setup de PostgreSQL e Redis

- [ ] 28. Testes de integração end-to-end
  - [ ]* 28.1 Escrever testes E2E com Playwright
    - Testar fluxo completo de OAuth
    - Testar fluxo completo de upload
    - Testar visualização de histórico
    - Testar mudança de idioma
  
  - [ ]* 28.2 Escrever testes de integração com APIs mockadas
    - Mockar APIs do YouTube, Facebook, Instagram, TikTok
    - Testar publicação em todas as plataformas
    - Testar tratamento de erros de API
    - _Requirements: 9.1-9.8_

- [ ] 29. Otimizações de performance
  - [ ] 29.1 Implementar chunked upload
    - Dividir arquivos grandes em chunks
    - Implementar upload resumível
    - Adicionar retry por chunk
  
  - [ ] 29.2 Adicionar caching
    - Cache de tokens OAuth em Redis
    - Cache de rate limits em Redis
    - Cache de metadados de vídeo
  
  - [ ] 29.3 Otimizar queries do banco de dados
    - Adicionar índices compostos onde necessário
    - Implementar connection pooling
    - Otimizar queries de histórico com paginação

- [ ] 30. Preparação para deployment
  - [ ] 30.1 Configurar variáveis de ambiente para produção
    - Configurar secrets no Vercel/plataforma de deploy
    - Configurar DATABASE_URL para produção
    - Configurar REDIS_URL para produção
  
  - [ ] 30.2 Configurar CI/CD
    - Configurar GitHub Actions ou similar
    - Adicionar steps de lint, type-check e tests
    - Configurar deploy automático para staging/production
  
  - [ ] 30.3 Configurar monitoramento em produção
    - Configurar Sentry para error tracking
    - Configurar Vercel Analytics
    - Configurar alertas para erros críticos

- [ ] 31. Final checkpoint - Sistema pronto para produção
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All code examples use TypeScript as specified in the design document
- OAuth credentials must be obtained from respective platforms before testing
- Database migrations should be run before starting the application
- Redis instance is required for queue and rate limiting functionality
