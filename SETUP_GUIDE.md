# 🚀 Guia Completo de Setup - gabrieltoth.com

Este guia permite que qualquer pessoa clone o projeto e rode localmente com um único arquivo `.env`.

---

## 📋 Pré-requisitos

- Node.js 22+ instalado
- Docker e Docker Compose instalados (opcional)
- Conta Google Cloud (para OAuth)
- Conta Supabase (para banco de dados)

---

## 🔧 Setup Rápido (5 minutos)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/gabrieltoth.com.git
cd gabrieltoth.com
```

### 2. Crie o Arquivo `.env.local`

Copie o template e preencha os valores:

```bash
cp .env.production.example .env.local
```

### 3. Configure as Variáveis Mínimas

Abra `.env.local` e configure **apenas estas variáveis obrigatórias**:

```bash
# ============================================
# OBRIGATÓRIO - Google OAuth
# ============================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-google-client-secret-aqui
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# ============================================
# OBRIGATÓRIO - Supabase
# ============================================
NEXT_PUBLIC_SUPABASE_URL=sua-supabase-url-aqui
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-supabase-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-supabase-service-role-key-aqui

# ============================================
# OBRIGATÓRIO - Configurações Gerais
# ============================================
NODE_ENV=development
BASE_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG=true
```

### 4. Instale as Dependências

```bash
npm install
```

### 5. Rode o Projeto

```bash
npm run dev
```

### 6. Acesse o Projeto

Abra: http://localhost:3000

---

## 🔑 Como Obter as Credenciais

### Google OAuth (OBRIGATÓRIO)

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie um novo projeto (ou selecione existente)
3. Clique em "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
4. Escolha "Web application"
5. Adicione estas URIs de redirect:
   ```
   http://localhost:3000/api/auth/google/callback
   http://127.0.0.1:3000/api/auth/google/callback
   ```
6. Copie o **Client ID** e **Client Secret**
7. Cole no `.env.local`

### Supabase (OBRIGATÓRIO)

1. Acesse: https://supabase.com/dashboard
2. Crie um novo projeto
3. Vá em Settings → API
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
5. Cole no `.env.local`

---

## 🐳 Setup com Docker (Opcional)

### 1. Configure o `.env.local`

Siga os passos acima para criar o `.env.local`.

### 2. Rode com Docker Compose

```bash
cd docker
docker-compose up -d
```

### 3. Acesse o Projeto

Abra: http://localhost:3000

---

## 📦 Variáveis Opcionais

Estas variáveis são **opcionais** e só precisam ser configuradas se você for usar esses serviços:

### WhatsApp Business API

```bash
WHATSAPP_ACCESS_TOKEN=seu-token-aqui
WHATSAPP_PHONE_NUMBER_ID=seu-phone-id-aqui
WHATSAPP_VERIFY_TOKEN=seu-verify-token-aqui
```

### PIX

```bash
PIX_KEY=sua-chave-pix-aqui
PIX_MERCHANT_NAME=Seu Nome
PIX_MERCHANT_CITY=Sua Cidade
```

### Monero

```bash
MONERO_ADDRESS=seu-endereco-monero-aqui
MONERO_VIEW_KEY=sua-view-key-aqui
```

### Amazon Associates

```bash
NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG=seu-tag-aqui
```

### Meta/Facebook

```bash
META_APP_ID=seu-app-id-aqui
META_APP_SECRET=seu-app-secret-aqui
```

### Instagram

```bash
INSTAGRAM_APP_ID=seu-app-id-aqui
INSTAGRAM_APP_SECRET=seu-app-secret-aqui
```

### TikTok

```bash
TIKTOK_CLIENT_KEY=seu-client-key-aqui
TIKTOK_CLIENT_SECRET=seu-client-secret-aqui
```

### AWS

```bash
AWS_ACCESS_KEY_ID=seu-access-key-aqui
AWS_SECRET_ACCESS_KEY=seu-secret-key-aqui
AWS_REGION=us-east-1
```

### Stripe

```bash
STRIPE_PUBLIC_KEY=seu-public-key-aqui
STRIPE_SECRET_KEY=seu-secret-key-aqui
```

### Discord

```bash
DISCORD_WEBHOOK_URL=seu-webhook-url-aqui
```

### Postman

```bash
POSTMAN_API_KEY=seu-api-key-aqui
```

---

## 🗄️ Setup do Banco de Dados

### Criar Tabelas no Supabase

1. Acesse: https://supabase.com/dashboard/project/_/editor
2. Execute este SQL:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  google_email VARCHAR(255) NOT NULL,
  google_name VARCHAR(255) NOT NULL,
  google_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_google_email ON users(google_email);

-- Tabela de sessões
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Tabela de audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
```

---

## ✅ Verificar se Está Funcionando

### 1. Teste o Build

```bash
npm run build
```

Deve compilar sem erros.

### 2. Teste o Login

1. Acesse: http://localhost:3000/pt-BR/register
2. Clique em "Login with Google"
3. Faça login com sua conta Google
4. Deve redirecionar para o dashboard

### 3. Verifique o Banco de Dados

1. Acesse: https://supabase.com/dashboard/project/_/editor
2. Abra a tabela `users`
3. Deve ter um registro com seus dados do Google

---

## 🐛 Problemas Comuns

### Erro: "Google Client ID not configured"

**Solução**: Verifique se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está no `.env.local` e reinicie o servidor.

### Erro: "redirect_uri_mismatch"

**Solução**: 
1. Vá no Google Cloud Console
2. Adicione `http://localhost:3000/api/auth/google/callback` nas URIs autorizadas
3. Aguarde 5 minutos

### Erro: "Supabase connection failed"

**Solução**: Verifique se as credenciais do Supabase estão corretas no `.env.local`.

### Docker não carrega variáveis

**Solução**: O Docker Compose carrega automaticamente o `.env.local` se estiver na raiz do projeto. Certifique-se de que o arquivo existe.

---

## 📁 Estrutura de Arquivos

```
gabrieltoth.com/
├── .env.local                    # Suas variáveis (não commitado)
├── .env.production.example       # Template de variáveis
├── docker/
│   ├── docker-compose.yml        # Docker local
│   └── docker-compose.prod.yml   # Docker produção
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # Componentes React
│   └── lib/                      # Utilitários
├── SETUP_GUIDE.md                # Este arquivo
├── GOOGLE_OAUTH_SETUP.md         # Guia Google OAuth
└── VERCEL_ENV_SETUP.md           # Guia Vercel
```

---

## 🚀 Deploy em Produção

### Vercel (Recomendado)

1. Faça push para o GitHub
2. Conecte o repositório na Vercel
3. Adicione as variáveis de ambiente (veja `VERCEL_ENV_SETUP.md`)
4. Deploy!

### Docker

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Suporte

- **Documentação**: Leia os arquivos `.md` na raiz do projeto
- **Issues**: Abra uma issue no GitHub
- **Email**: gabrieltothgoncalves@gmail.com

---

## ✅ Checklist de Setup

- [ ] Clonei o repositório
- [ ] Criei o `.env.local`
- [ ] Configurei Google OAuth
- [ ] Configurei Supabase
- [ ] Criei as tabelas no Supabase
- [ ] Rodei `npm install`
- [ ] Rodei `npm run dev`
- [ ] Testei o login com Google
- [ ] Login funcionou!

---

**Última atualização**: 2025-01-19
