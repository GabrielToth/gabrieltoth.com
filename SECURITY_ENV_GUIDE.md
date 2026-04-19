# Guia de Segurança - Variáveis de Ambiente

## ⚠️ IMPORTANTE: Dados Sensíveis Expostos

**ATENÇÃO**: Você expôs dados sensíveis no chat e possivelmente na Vercel. Siga as ações corretivas abaixo.

---

## 🔴 Variáveis SECRETAS (NUNCA expor publicamente)

Estas variáveis **DEVEM SER ROTACIONADAS IMEDIATAMENTE** se foram expostas:

### 1. **Tokens de API e Secrets**
```bash
# ❌ NUNCA expor estas variáveis
GOOGLE_CLIENT_SECRET=GOCSPX-***  # Rotacionar no Google Cloud Console
META_APP_SECRET=***              # Rotacionar no Meta for Developers
INSTAGRAM_APP_SECRET=***         # Rotacionar no Meta for Developers
TIKTOK_CLIENT_SECRET=***         # Rotacionar no TikTok for Developers
STRIPE_SECRET_KEY=sk_***         # Rotacionar no Stripe Dashboard
POSTMAN_API_KEY=PMAK-***         # Rotacionar no Postman
```

### 2. **Credenciais AWS**
```bash
# ❌ CRÍTICO - Rotacionar IMEDIATAMENTE
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
```
**Ação**: Vá para [AWS IAM Console](https://console.aws.amazon.com/iam/) → Users → Security Credentials → Delete old keys → Create new keys

### 3. **Tokens de Acesso**
```bash
# ❌ NUNCA expor
WHATSAPP_ACCESS_TOKEN=***        # Rotacionar no Meta for Developers
SUPABASE_SERVICE_ROLE_KEY=***    # Rotacionar no Supabase Dashboard
DISCORD_WEBHOOK_URL=***          # Regenerar no Discord
```

### 4. **Chaves de Criptografia**
```bash
# ❌ NUNCA expor
ENCRYPTION_KEY=***               # Gerar nova chave
MONERO_VIEW_KEY=***              # Não pode ser alterada (chave da carteira)
```

### 5. **Senhas de Banco de Dados**
```bash
# ❌ NUNCA expor
POSTGRES_PASSWORD=***
DATABASE_URL=postgres://user:password@host/db  # Contém senha
```

---

## 🟢 Variáveis PÚBLICAS (Seguras para expor)

Estas variáveis podem ser expostas publicamente (começam com `NEXT_PUBLIC_`):

```bash
# ✅ Seguro expor
NEXT_PUBLIC_GOOGLE_CLIENT_ID=***
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=***
NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG=***
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=***
```

### IDs de Aplicativos (Públicos)
```bash
# ✅ Seguro expor (são IDs públicos, não secrets)
GOOGLE_CLIENT_ID=***
META_APP_ID=***
INSTAGRAM_APP_ID=***
TIKTOK_CLIENT_KEY=***
STRIPE_PUBLIC_KEY=pk_***
```

---

## 🔧 Ações Corretivas URGENTES

### 1. **Rotacionar Credenciais AWS** (CRÍTICO)
```bash
# 1. Acesse: https://console.aws.amazon.com/iam/
# 2. Vá em Users → Seu usuário → Security credentials
# 3. Delete as access keys antigas
# 4. Crie novas access keys
# 5. Atualize .env.local e Vercel
```

### 2. **Rotacionar Google Client Secret**
```bash
# 1. Acesse: https://console.cloud.google.com/apis/credentials
# 2. Selecione seu OAuth 2.0 Client ID
# 3. Clique em "Reset Secret"
# 4. Copie o novo secret
# 5. Atualize .env.local e Vercel
```

### 3. **Rotacionar Meta/Facebook Secrets**
```bash
# 1. Acesse: https://developers.facebook.com/apps/
# 2. Selecione seu app
# 3. Settings → Basic
# 4. Clique em "Reset App Secret"
# 5. Atualize .env.local e Vercel
```

### 4. **Rotacionar Stripe Secret Key**
```bash
# 1. Acesse: https://dashboard.stripe.com/apikeys
# 2. Revogue a chave antiga
# 3. Crie uma nova secret key
# 4. Atualize .env.local e Vercel
```

### 5. **Rotacionar WhatsApp Access Token**
```bash
# 1. Acesse: https://developers.facebook.com/apps/
# 2. Selecione seu app → WhatsApp → API Setup
# 3. Gere um novo token
# 4. Atualize .env.local e Vercel
```

### 6. **Rotacionar Supabase Service Role Key**
```bash
# 1. Acesse: https://supabase.com/dashboard/project/_/settings/api
# 2. Regenere o service_role key
# 3. Atualize .env.local e Vercel
```

### 7. **Regenerar Discord Webhook**
```bash
# 1. Acesse o canal do Discord
# 2. Settings → Integrations → Webhooks
# 3. Delete o webhook antigo
# 4. Crie um novo webhook
# 5. Atualize .env.local e Vercel
```

---

## 📋 Checklist de Segurança

- [ ] Rotacionar AWS credentials
- [ ] Rotacionar Google Client Secret
- [ ] Rotacionar Meta/Facebook App Secret
- [ ] Rotacionar Instagram App Secret
- [ ] Rotacionar Stripe Secret Key
- [ ] Rotacionar WhatsApp Access Token
- [ ] Rotacionar Supabase Service Role Key
- [ ] Regenerar Discord Webhook
- [ ] Rotacionar Postman API Key
- [ ] Gerar nova ENCRYPTION_KEY
- [ ] Atualizar todas as variáveis na Vercel
- [ ] Testar aplicação após rotação

---

## 🛡️ Boas Práticas para Vercel

### Variáveis que DEVEM estar na Vercel:

**Environment Variables (Production):**
```bash
# Públicas (podem ser expostas)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=***
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=***
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://www.gabrieltoth.com/api/auth/google/callback
NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG=***
NEXT_PUBLIC_DEBUG=false

# Privadas (apenas server-side)
GOOGLE_CLIENT_SECRET=***
META_APP_SECRET=***
INSTAGRAM_APP_SECRET=***
TIKTOK_CLIENT_SECRET=***
STRIPE_SECRET_KEY=***
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
WHATSAPP_ACCESS_TOKEN=***
SUPABASE_SERVICE_ROLE_KEY=***
DISCORD_WEBHOOK_URL=***
ENCRYPTION_KEY=***
DATABASE_URL=***
REDIS_URL=***
```

### Como adicionar na Vercel:
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione cada variável individualmente
3. Selecione o ambiente: Production, Preview, Development
4. **NUNCA** adicione secrets em variáveis que começam com `NEXT_PUBLIC_`

---

## 🔍 Como Verificar se Dados Foram Expostos

### 1. Verificar no GitHub
```bash
git log --all --full-history --source -- .env*
```

### 2. Verificar no Vercel
- Vá em Settings → Environment Variables
- Verifique se há variáveis secretas expostas como `NEXT_PUBLIC_`

### 3. Verificar no código
```bash
# Procurar por secrets hardcoded
grep -r "GOCSPX-" .
grep -r "sk_test_" .
grep -r "AKIA" .
```

---

## 📝 Regras de Ouro

1. **NUNCA** commite arquivos `.env*` no git (já está no `.gitignore`)
2. **NUNCA** exponha secrets em variáveis `NEXT_PUBLIC_`
3. **SEMPRE** use `NEXT_PUBLIC_` apenas para dados públicos
4. **SEMPRE** rotacione credenciais se foram expostas
5. **SEMPRE** use secrets diferentes para dev/staging/production
6. **NUNCA** compartilhe `.env` files em chat, email, ou mensagens

---

## 🆘 Em Caso de Exposição

1. **Rotacione IMEDIATAMENTE** todas as credenciais expostas
2. **Monitore** logs de acesso das APIs por atividade suspeita
3. **Revogue** tokens antigos
4. **Atualize** todas as variáveis na Vercel
5. **Teste** a aplicação após rotação

---

## 📞 Contatos de Suporte

- **AWS**: https://console.aws.amazon.com/support/
- **Google Cloud**: https://cloud.google.com/support
- **Meta/Facebook**: https://developers.facebook.com/support/
- **Stripe**: https://support.stripe.com/
- **Supabase**: https://supabase.com/support

---

**Última atualização**: 2025-01-19
