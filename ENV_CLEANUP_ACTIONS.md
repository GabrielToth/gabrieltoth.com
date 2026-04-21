# 🧹 Ações de Limpeza de Variáveis de Ambiente

**Data**: 20 de Abril de 2026  
**Status**: Pronto para execução

---

## 📋 Resumo Executivo

Você tem **63 variáveis** na Vercel. Vamos:
- ✅ **Manter**: 9 variáveis ativas
- ❌ **Remover**: 18 variáveis desnecessárias
- ⚠️ **Revisar**: 6 variáveis com dúvidas
- 🔄 **To-Do**: 30 variáveis para implementação futura

---

## 🚨 AÇÕES IMEDIATAS (Críticas)

### 1. Adicionar na Vercel

**`GOOGLE_CLIENT_ID`** (Server-Side)
```
Nome: GOOGLE_CLIENT_ID
Valor: 1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
Motivo: Google OAuth não funciona sem isso no servidor
```

---

## ❌ REMOVER da Vercel IMEDIATAMENTE

### Duplicadas (1 variável)
```
1. NEXT_PUBLIC_SUPABASE_ANON_KEY
   Motivo: Duplicada - usar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

### MercadoPago (4 variáveis - usando Stripe)
```
2. MERCADOPAGO_ACCESS_TOKEN
3. MERCADOPAGO_CLIENT_ID
4. MERCADOPAGO_CLIENT_SECRET
5. MERCADOPAGO_PUBLIC_KEY
   Motivo: Projeto usa Stripe, não MercadoPago
```

### PIX (3 variáveis - será removido do projeto)
```
6. PIX_KEY
7. PIX_MERCHANT_CITY
8. PIX_MERCHANT_NAME
   Motivo: Será removido completamente do projeto (To-Do)
```

### Excluído do Projeto (1 variável)
```
9. CDP_ENDPOINT
   Motivo: Sem referências no código, lixo do sistema
```

### AWS (5 variáveis - apenas CI/CD)
```
10. AWS_ACCESS_KEY_ID
11. AWS_PROFILE
12. AWS_REGION
13. AWS_SECRET_ACCESS_KEY
    Motivo: Apenas para GitHub Actions, não Vercel
    Onde usar: .github/workflows/deploy-aws.yml
```

### Docker (4 variáveis - apenas Docker)
```
14. BASE_URL
15. POSTGRES_DB
16. POSTGRES_PASSWORD
17. POSTGRES_USER
    Motivo: Apenas para docker-compose.yml, não Vercel
    Onde usar: .env.docker (já consolidado)
```

### Não Implementado (1 variável)
```
18. REDIS_URL
    Motivo: Redis não está implementado ainda
    Quando adicionar: Quando implementar cache (To-Do futuro)
```

---

## ⚠️ REVISAR (6 variáveis)

### 1. DATABASE_URL
**Situação**: Usada no código mas Vercel tem Postgres integrado
**Ação**: 
- [ ] Verificar se Vercel fornece automaticamente
- [ ] Se sim, remover de `.env.production`
- [ ] Se não, manter na Vercel

**Referências no código**:
- `src/lib/db/index.ts`
- `docker-compose.yml`

---

### 2. SUPABASE_SERVICE_ROLE_KEY
**Situação**: Apenas usada em testes, não em produção
**Ação**:
- [ ] Verificar se precisa em produção
- [ ] Se não, remover de `.env.production`
- [ ] Manter em `.env.local` para testes

**Referências no código**:
- `src/__tests__/database-constraints.test.ts`

---

### 3. GITHUB_TOKEN
**Situação**: Não usada no código, pode ser para MCP
**Ação**:
- [ ] Verificar se algum MCP precisa
- [ ] Se não, remover da Vercel
- [ ] Se sim, manter apenas em Development

---

### 4. POSTMAN_API_KEY
**Situação**: Não usada no código, pode ser para MCP
**Ação**:
- [ ] Verificar se algum MCP precisa
- [ ] Se não, remover da Vercel
- [ ] Se sim, manter apenas em Development

---

### 5. DEBUG e NEXT_PUBLIC_DEBUG
**Situação**: Apenas para debug, não obrigatório em produção
**Ação**:
- [ ] Desativar em Production (false ou não definir)
- [ ] Manter ativado em Development (true)
- [ ] Manter ativado em Preview (true)

**Valores recomendados**:
```
Development:  DEBUG=true, NEXT_PUBLIC_DEBUG=true
Preview:      DEBUG=true, NEXT_PUBLIC_DEBUG=true
Production:   DEBUG=false, NEXT_PUBLIC_DEBUG=false (ou não definir)
```

---

### 6. WhatsApp (3 variáveis - não está funcionando)
**Situação**: Configuradas mas não funciona
**Ação**:
- [ ] Investigar por que não recebe mensagens
- [ ] Criar spec para corrigir integração
- [ ] Depois decidir se mantém ou remove

**Variáveis**:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`

**Referências no código**:
- `src/app/api/whatsapp/webhook/route.ts`

---

## ✅ MANTER na Vercel (9 variáveis)

### Ativas e Funcionando

| Variável | Ambiente | Sensitive | Motivo |
|----------|----------|-----------|--------|
| `DISCORD_WEBHOOK_URL` | Prod + Preview | ✅ | Notificações de registro/login |
| `GOOGLE_CLIENT_SECRET` | Prod + Preview | ✅ | Google OAuth funcionando |
| `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` | Prod + Preview | ❌ | Links de afiliado |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Prod + Preview | ❌ | Botão de login Google |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | Prod + Preview | ❌ | Google OAuth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Prod + Preview | ❌ | Supabase funcionando |
| `NEXT_PUBLIC_SUPABASE_URL` | Prod + Preview | ❌ | Supabase funcionando |
| `STRIPE_SECRET_KEY` | Prod + Preview | ✅ | Pagamentos funcionando |
| `SEND_DISCORD_IN_TESTS` | Prod + Preview | ❌ | Notificações de teste |

---

## 🔄 TO-DO FUTURO (Não adicionar agora)

### Quando implementar cada feature:

#### 1. Video Upload Multi-Platform (Spec já existe)
```
APP_URL
INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET
META_APP_ID
META_APP_SECRET
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
```

#### 2. Login com Discord (Spec a criar)
```
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_GUILD_ID
DISCORD_REDIRECT_URI
```

#### 3. Unificação de Chats de Streaming (Spec a criar)
```
KICK_BROADCASTER_USER_ID
KICK_CHATROOM_ID
KICK_CLIENT_ID
KICK_CLIENT_SECRET
KICK_REDIRECT_URI
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
TWITCH_REDIRECT_URI
```

#### 4. Sistema de Pagamento Monero (Spec a criar)
```
MONERO_ADDRESS (já em Vercel)
MONERO_VIEW_KEY (já em Vercel)
```

#### 5. Remover PIX do Projeto (Spec a criar)
```
PIX_KEY (remover)
PIX_MERCHANT_CITY (remover)
PIX_MERCHANT_NAME (remover)
```

#### 6. Implementar Cache com Redis (Futuro distante)
```
REDIS_URL (remover por enquanto)
```

---

## 📝 Checklist de Execução

### Passo 1: Adicionar na Vercel
- [ ] Adicionar `GOOGLE_CLIENT_ID` (Prod + Preview, Sensitive)

### Passo 2: Remover da Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (duplicada)
- [ ] `MERCADOPAGO_ACCESS_TOKEN`
- [ ] `MERCADOPAGO_CLIENT_ID`
- [ ] `MERCADOPAGO_CLIENT_SECRET`
- [ ] `MERCADOPAGO_PUBLIC_KEY`
- [ ] `PIX_KEY`
- [ ] `PIX_MERCHANT_CITY`
- [ ] `PIX_MERCHANT_NAME`
- [ ] `CDP_ENDPOINT`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_PROFILE`
- [ ] `AWS_REGION`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `BASE_URL`
- [ ] `POSTGRES_DB`
- [ ] `POSTGRES_PASSWORD`
- [ ] `POSTGRES_USER`
- [ ] `REDIS_URL`

### Passo 3: Revisar
- [ ] `DATABASE_URL` - Vercel fornece automaticamente?
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Precisa em produção?
- [ ] `GITHUB_TOKEN` - Algum MCP precisa?
- [ ] `POSTMAN_API_KEY` - Algum MCP precisa?
- [ ] `DEBUG` - Desativar em Production
- [ ] `NEXT_PUBLIC_DEBUG` - Desativar em Production
- [ ] WhatsApp (3 variáveis) - Investigar por que não funciona

### Passo 4: Criar Specs (Futuro)
- [ ] Spec: Investigar e Corrigir WhatsApp
- [ ] Spec: Login com Discord
- [ ] Spec: Unificação de Chats de Streaming
- [ ] Spec: Sistema de Pagamento Monero
- [ ] Spec: Remover PIX do Projeto
- [ ] Spec: Implementar Cache com Redis

---

## 📊 Resumo de Ambientes

### Development (`.env.local`)
```
✅ NODE_ENV=development
✅ DEBUG=true
✅ NEXT_PUBLIC_DEBUG=true
✅ DATABASE_URL (local)
✅ POSTGRES_* (local)
✅ REDIS_URL (local)
✅ Google OAuth (dev)
✅ Supabase
✅ Stripe (test)
✅ Discord Webhook
✅ Amazon Associates
✅ Monero
```

### Production (`.env.production`)
```
✅ Google OAuth (prod)
✅ Supabase
✅ Stripe (prod)
✅ Discord Webhook
✅ Amazon Associates
✅ Monero
❌ DATABASE_URL (Vercel fornece?)
❌ SUPABASE_SERVICE_ROLE_KEY (apenas testes)
❌ DEBUG (desativar)
❌ NEXT_PUBLIC_DEBUG (desativar)
```

### Vercel (Production + Preview)
```
✅ GOOGLE_CLIENT_ID (adicionar)
✅ GOOGLE_CLIENT_SECRET
✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID
✅ NEXT_PUBLIC_GOOGLE_REDIRECT_URI
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
✅ STRIPE_SECRET_KEY
✅ DISCORD_WEBHOOK_URL
✅ NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
✅ SEND_DISCORD_IN_TESTS
✅ MONERO_ADDRESS
✅ MONERO_VIEW_KEY
❌ Remover 18 variáveis (ver Passo 2)
```

---

## 🔒 Segurança

### Variáveis que DEVEM ser "Sensitive" na Vercel:
- `GOOGLE_CLIENT_ID` (server-side)
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `DISCORD_WEBHOOK_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (se manter)
- `WHATSAPP_ACCESS_TOKEN` (se manter)

### Variáveis que NÃO precisam ser "Sensitive":
- Todas as `NEXT_PUBLIC_*` (públicas por natureza)
- `SEND_DISCORD_IN_TESTS`
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`

---

## 📞 Próximos Passos

1. **Hoje**: Executar Passo 1, 2 e 3 do checklist
2. **Depois**: Rotacionar Google OAuth credentials (você já planejou)
3. **Futuro**: Criar specs para cada To-Do

---

**Última atualização**: 20 de Abril de 2026
