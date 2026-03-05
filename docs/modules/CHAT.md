# Módulo: Chat Unificado

## Descrição

Agregador de chats de múltiplas plataformas com sistema de moderação cross-platform.

## Funcionalidades

- Ver chats de streamers ao vivo (grátis)
- Chat unificado para streamers (pago)
- Moderação cross-platform
- Timeouts persistentes/renováveis
- Notificações de subs/gifts

## Arquivos

- `src/app/api/platform/chat/route.ts` - API e WebSocket
- `src/lib/platforms/` - Adaptadores de cada plataforma

## Plataformas Suportadas

- Twitch (IRC)
- YouTube Live
- Kick
- TikTok Live
- Facebook Gaming
- Trovo

## Custo

- Mensagem recebida: 1 crédito
- Timeout: 10 créditos
- Ban: 25 créditos

## Status: 🔴 NÃO IMPLEMENTADO

Próximo passo: v0.5.0
