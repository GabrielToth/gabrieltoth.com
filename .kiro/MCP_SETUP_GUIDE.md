# Guia de Configuração MCP - Obter Todas as Chaves de API

## 1. POSTMAN ✅ (Você já tem!)
**Chave:** Adicione ao arquivo `.env.local`
**Onde obter:** https://web.postman.co/settings/me/api-keys

---

## 2. AWS (Amplify, CloudWatch, etc.)

### Obter Credenciais AWS:
1. Acesse: https://console.aws.amazon.com/
2. Faça login com sua conta AWS
3. Vá para: **IAM** → **Users** → **Security credentials**
4. Clique em **Create access key**
5. Copie:
   - **Access Key ID**
   - **Secret Access Key**

### Configurar localmente:
```bash
aws configure
# Será pedido:
# AWS Access Key ID: [cole aqui]
# AWS Secret Access Key: [cole aqui]
# Default region: us-east-1
# Default output format: json
```

---

## 3. STRIPE (Pagamentos)

### Obter Chaves Stripe:
1. Acesse: https://dashboard.stripe.com/
2. Faça login
3. Vá para: **Developers** → **API keys**
4. Copie:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)

---

## 4. SUPABASE (Banco de Dados)

### Obter Chaves Supabase:
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto
4. Vá para: **Settings** → **API**
5. Copie:
   - **Project URL**
   - **anon public** (chave pública)
   - **service_role** (chave privada)

---

## 5. GOOGLE CLOUD (YouTube, Gmail, etc.)

### Obter Credenciais Google:
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto
3. Ative as APIs necessárias:
   - YouTube Data API v3
   - Gmail API
   - Google Drive API
4. Vá para: **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Copie:
   - **Client ID**
   - **Client Secret**

---

## 6. META/FACEBOOK (Facebook, Instagram)

### Obter Credenciais Meta:
1. Acesse: https://developers.facebook.com/
2. Faça login
3. Crie um novo app
4. Vá para: **Settings** → **Basic**
5. Copie:
   - **App ID**
   - **App Secret**

---

## 7. TIKTOK

### Obter Credenciais TikTok:
1. Acesse: https://developers.tiktok.com/
2. Faça login
3. Crie um novo app
4. Copie:
   - **Client Key**
   - **Client Secret**

---

## 8. GITHUB (Opcional)

### Obter Token GitHub:
1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token**
3. Selecione escopos: `repo`, `admin:repo_hook`
4. Copie o token gerado

---

## 9. DOCKER (Para Terraform)

### Instalar Docker:
1. Baixe: https://www.docker.com/products/docker-desktop
2. Instale e reinicie o computador
3. Verifique: `docker --version`

---

## Próximos Passos:

1. Reúna todas as chaves
2. Adicione ao `.env.local`
3. Reinicie o Kiro
4. As conexões MCP serão estabelecidas automaticamente

