# 🔐 Guia de Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Segurança

Os arquivos `.env.local`, `.env.production` e `.env.docker` contêm **chaves secretas** e **NÃO devem ser commitados** no Git.

Eles estão no `.gitignore` para proteção.

---

## 📋 Setup Inicial

### 1. Desenvolvimento Local (`.env.local`)

```bash
# Copiar o arquivo de exemplo
cp .env.local.example .env.local

# Editar e preencher com suas chaves
nano .env.local
```

**Variáveis necessárias:**
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (Google OAuth)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `MONERO_ADDRESS` e `MONERO_VIEW_KEY`
- `DISCORD_WEBHOOK_URL`

### 2. Produção (`.env.production`)

```bash
# Copiar o arquivo de exemplo
cp .env.production.example .env.production

# Editar e preencher com suas chaves de produção
nano .env.production
```

**Variáveis necessárias:**
- Mesmas do `.env.local`, mas com valores de produção
- URLs devem apontar para `https://www.gabrieltoth.com`

### 3. Docker (`.env.docker`)

```bash
# Copiar o arquivo de exemplo
cp .env.docker.example .env.docker

# Editar se necessário (valores padrão geralmente funcionam)
nano .env.docker
```

**Variáveis necessárias:**
- `POSTGRES_PASSWORD` (deve ser igual ao `.env.local`)
- `BASE_URL` (geralmente `http://localhost:3000`)

---

## 🚀 Como Usar

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Rodar testes
npm run test
```

### Docker

```bash
# Subir containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down
```

---

## 🔄 Rotação de Chaves

Quando precisar rotacionar chaves (por segurança):

1. **Gerar novas chaves** em cada serviço (Google, Stripe, etc.)
2. **Atualizar `.env.local`** com as novas chaves
3. **Atualizar `.env.production`** com as novas chaves
4. **Atualizar na Vercel** (Production e Preview)
5. **Testar** antes de fazer deploy

---

## 📝 Variáveis Ativas

### `.env.local` (21 variáveis):

```
SEND_DISCORD_IN_TESTS
DISCORD_WEBHOOK_URL
NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
NEXT_PUBLIC_DEBUG
NODE_ENV
DEBUG
DATABASE_URL
REDIS_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_REDIRECT_URI
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
MONERO_ADDRESS
MONERO_VIEW_KEY
```

### `.env.production` (16 variáveis):

```
NODE_ENV
NEXT_PUBLIC_DEBUG
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_REDIRECT_URI
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
REDIS_URL
DISCORD_WEBHOOK_URL
MONERO_ADDRESS
MONERO_VIEW_KEY
NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
STRIPE_SECRET_KEY
```

### `.env.docker` (8 variáveis):

```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
DISCORD_WEBHOOK_URL
DEBUG
BASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## ✅ Checklist de Setup

- [ ] Copiar `.env.local.example` para `.env.local`
- [ ] Preencher `.env.local` com suas chaves
- [ ] Copiar `.env.production.example` para `.env.production`
- [ ] Preencher `.env.production` com suas chaves de produção
- [ ] Copiar `.env.docker.example` para `.env.docker`
- [ ] Testar desenvolvimento local: `npm run dev`
- [ ] Testar Docker: `docker-compose up -d`
- [ ] Verificar que `.env*` está no `.gitignore`
- [ ] Nunca fazer commit de `.env.local`, `.env.production` ou `.env.docker`

---

## 🔒 Segurança

### ✅ Fazer:
- Manter `.env*` fora do Git
- Usar `.env.*.example` como referência
- Rotacionar chaves regularmente
- Usar valores diferentes para dev e produção
- Proteger chaves secretas

### ❌ NÃO fazer:
- Commitar arquivos `.env` no Git
- Compartilhar chaves secretas
- Usar mesmas chaves em dev e produção
- Expor chaves em logs ou mensagens de erro
- Deixar chaves em código-fonte

---

## 📞 Suporte

Para mais informações sobre variáveis de ambiente:
- `VERCEL_ENVIRONMENT_VARIABLES.md` - Guia completo
- `GOOGLE_OAUTH_ENV_VARS.md` - Detalhes do Google OAuth
- `ENV_CLEANUP_PLAN.md` - Plano de limpeza

---

**Última atualização**: 20 de Abril de 2026
