# 🔐 Configuração de Credenciais MCP

## ✅ Já Configurado

### Postman
✅ Chave adicionada ao `.env.local`
⚠️ Nunca compartilhe sua chave de API

---

## ⚠️ Próximos Passos - Obter Outras Chaves

### 1️⃣ AWS (Amplify, CloudWatch, etc.)

**Passo 1:** Acesse https://console.aws.amazon.com/iam/
**Passo 2:** Clique em **Users** → Seu usuário
**Passo 3:** Vá para **Security credentials** → **Create access key**
**Passo 4:** Copie:
- Access Key ID
- Secret Access Key

**Adicione ao `.env.local`:**
```
AWS_ACCESS_KEY_ID=seu_access_key_aqui
AWS_SECRET_ACCESS_KEY=seu_secret_key_aqui
AWS_REGION=us-east-1
```

---

### 2️⃣ Stripe (Pagamentos)

**Passo 1:** Acesse https://dashboard.stripe.com/
**Passo 2:** Vá para **Developers** → **API keys**
**Passo 3:** Copie:
- Publishable key (pk_...)
- Secret key (sk_...)

**Adicione ao `.env.local`:**
```
STRIPE_PUBLIC_KEY=pk_seu_public_key
STRIPE_SECRET_KEY=sk_seu_secret_key
```

---

### 3️⃣ Supabase (Banco de Dados)

**Passo 1:** Acesse https://supabase.com/dashboard
**Passo 2:** Selecione seu projeto
**Passo 3:** Vá para **Settings** → **API**
**Passo 4:** Copie:
- Project URL
- Service Role Secret (chave privada)

**Adicione ao `.env.local`:**
```
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
```

---

### 4️⃣ Google Cloud (YouTube, Gmail)

**Passo 1:** Acesse https://console.cloud.google.com/
**Passo 2:** Crie um novo projeto
**Passo 3:** Ative APIs:
- YouTube Data API v3
- Gmail API
- Google Drive API

**Passo 4:** Vá para **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
**Passo 5:** Copie Client ID e Client Secret

**Adicione ao `.env.local`:**
```
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
```

---

### 5️⃣ Meta/Facebook (Facebook, Instagram)

**Passo 1:** Acesse https://developers.facebook.com/
**Passo 2:** Crie um novo app
**Passo 3:** Vá para **Settings** → **Basic**
**Passo 4:** Copie:
- App ID
- App Secret

**Adicione ao `.env.local`:**
```
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
```

---

### 6️⃣ TikTok

**Passo 1:** Acesse https://developers.tiktok.com/
**Passo 2:** Crie um novo app
**Passo 3:** Copie:
- Client Key
- Client Secret

**Adicione ao `.env.local`:**
```
TIKTOK_CLIENT_KEY=seu_client_key
TIKTOK_CLIENT_SECRET=seu_client_secret
```

---

### 7️⃣ GitHub (Opcional)

**Passo 1:** Acesse https://github.com/settings/tokens
**Passo 2:** Clique em **Generate new token**
**Passo 3:** Selecione escopos: `repo`, `admin:repo_hook`
**Passo 4:** Copie o token

**Adicione ao `.env.local`:**
```
GITHUB_TOKEN=seu_github_token
```

---

### 8️⃣ Docker (Para Terraform)

**Passo 1:** Baixe https://www.docker.com/products/docker-desktop
**Passo 2:** Instale e reinicie
**Passo 3:** Verifique: `docker --version`

---

## 📋 Checklist

- [ ] AWS Access Key ID
- [ ] AWS Secret Access Key
- [ ] Stripe Public Key
- [ ] Stripe Secret Key
- [ ] Supabase Service Role Key
- [ ] Google Client ID
- [ ] Google Client Secret
- [ ] Meta App ID
- [ ] Meta App Secret
- [ ] TikTok Client Key
- [ ] TikTok Client Secret
- [ ] GitHub Token (opcional)
- [ ] Docker instalado

---

## 🚀 Após Adicionar as Chaves

1. Salve o `.env.local`
2. Reinicie o Kiro
3. As conexões MCP serão estabelecidas automaticamente

---

## ⚡ Dica Rápida

Se quiser testar uma chave específica:
```bash
# Testar Postman
curl -H "Authorization: Bearer YOUR_POSTMAN_API_KEY" \
  https://api.getpostman.com/me

# Testar AWS
aws sts get-caller-identity

# Testar Stripe
curl https://api.stripe.com/v1/account \
  -u YOUR_STRIPE_SECRET_KEY:
```

