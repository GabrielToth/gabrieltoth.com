# Módulo: Autenticação

## Descrição

Sistema de autenticação usando Auth.js (NextAuth) com PostgreSQL como banco de sessões.

## Funcionalidades

- Login via Google OAuth
- Vinculação de múltiplas plataformas (Twitch, YouTube, Kick, TikTok, etc.)
- Identificador único cross-platform

## Arquivos

- `src/lib/auth/` - Configuração Auth.js
- `src/app/api/auth/[...nextauth]/route.ts` - Rotas de auth

## Fluxo

1. Usuário clica "Login com Google"
2. Redireciona para Google OAuth
3. Callback cria/atualiza perfil no banco
4. Sessão criada no Redis/DB

## Vinculação de Plataformas

Após login, usuário pode vincular:

- Twitch, YouTube, Kick, TikTok, Facebook, Trovo, Kwai

Cada vinculação armazena:

- `platform_user_id`
- `platform_username`
- `access_token` / `refresh_token`

## Status: 🔴 NÃO IMPLEMENTADO

Próximo passo: v0.2.0
