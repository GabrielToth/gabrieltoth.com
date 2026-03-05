# Módulo: YouTube Tools

## Descrição

Ferramentas para download, metadados e agendamento de conteúdo do YouTube.

## Funcionalidades

- Download de vídeos (múltiplas qualidades)
- Download de playlists/canais completos
- Extração de metadados (thumb, descrição, tags)
- Agendamento de publicação multi-plataforma
- Reescrita com IA

## Arquivos

- `src/app/api/platform/youtube/route.ts` - API endpoints
- `src/lib/youtube/` - Lógica de download (wrapper yt-dlp)

## Custo

- Download: 100 créditos/minuto de vídeo
- Metadados: Grátis (com download)
- Agendar post: 50 créditos
- Rewrite IA: 500 créditos/1k tokens

## Limitações

- Downloads processados via queue (Cloudflare Workers ou QStash)
- Armazenamento temporário em R2/S3

## Status: 🔴 NÃO IMPLEMENTADO

Próximo passo: v0.4.0
