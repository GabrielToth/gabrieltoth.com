# 🇧🇷 Guia Completo de Configuração MCP em Português

## 📌 O Que Você Tem Agora

✅ **Postman** - Chave já adicionada  
✅ **Supabase Hosted** - Funcionando  
⏳ **Tudo mais** - Aguardando suas chaves

---

## 🎯 Objetivo

Configurar todos os serviços MCP para ter acesso máximo a todas as APIs e ferramentas.

---

## 📚 Arquivos de Referência

1. **`.kiro/QUICK_START.md`** - Início rápido
2. **`.kiro/SETUP_CREDENTIALS.md`** - Instruções detalhadas
3. **`.kiro/MCP_STATUS.md`** - Status de cada serviço
4. **`.env.local`** - Arquivo onde adicionar as chaves

---

## 🔑 Como Adicionar Chaves ao `.env.local`

### Passo 1: Abra o arquivo
Abra `.env.local` na raiz do projeto

### Passo 2: Procure pela seção MCP
```
# ============================================
# MCP Servers Configuration
# ============================================
```

### Passo 3: Adicione suas chaves
```
POSTMAN_API_KEY=sua_chave_aqui
AWS_ACCESS_KEY_ID=sua_chave_aqui
AWS_SECRET_ACCESS_KEY=sua_chave_aqui
# ... etc
```

### Passo 4: Salve o arquivo
Ctrl+S (ou Cmd+S no Mac)

### Passo 5: Reinicie o Kiro
Feche e abra novamente

---

## 🚀 Ordem Recomendada de Configuração

### 1️⃣ AWS (PRIORIDADE ALTA)
**Por que?** Desbloqueará 7 serviços MCP

**Tempo:** 5 minutos

**Passos:**
1. Acesse https://console.aws.amazon.com/iam/
2. Clique em **Users** (Usuários)
3. Selecione seu usuário
4. Vá para **Security credentials** (Credenciais de segurança)
5. Clique em **Create access key** (Criar chave de acesso)
6. Copie:
   - **Access Key ID**
   - **Secret Access Key**
7. Adicione ao `.env.local`:
```
AWS_ACCESS_KEY_ID=cole_aqui
AWS_SECRET_ACCESS_KEY=cole_aqui
AWS_REGION=us-east-1
```

---

### 2️⃣ Stripe (PRIORIDADE MÉDIA)
**Por que?** Se você quer processar pagamentos

**Tempo:** 3 minutos

**Passos:**
1. Acesse https://dashboard.stripe.com/
2. Faça login
3. Vá para **Developers** → **API keys**
4. Copie:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)
5. Adicione ao `.env.local`:
```
STRIPE_PUBLIC_KEY=pk_cole_aqui
STRIPE_SECRET_KEY=sk_cole_aqui
```

---

### 3️⃣ Google Cloud (PRIORIDADE MÉDIA)
**Por que?** Para YouTube, Gmail, Google Drive

**Tempo:** 10 minutos

**Passos:**
1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto (ou use um existente)
3. Ative as APIs:
   - YouTube Data API v3
   - Gmail API
   - Google Drive API
4. Vá para **Credentials** (Credenciais)
5. Clique em **Create Credentials** → **OAuth 2.0 Client ID**
6. Copie:
   - **Client ID**
   - **Client Secret**
7. Adicione ao `.env.local`:
```
GOOGLE_CLIENT_ID=cole_aqui
GOOGLE_CLIENT_SECRET=cole_aqui
```

---

### 4️⃣ Meta/Facebook (PRIORIDADE MÉDIA)
**Por que?** Para Facebook e Instagram

**Tempo:** 5 minutos

**Passos:**
1. Acesse https://developers.facebook.com/
2. Faça login
3. Crie um novo app (ou use um existente)
4. Vá para **Settings** → **Basic**
5. Copie:
   - **App ID**
   - **App Secret**
6. Adicione ao `.env.local`:
```
META_APP_ID=cole_aqui
META_APP_SECRET=cole_aqui
```

---

### 5️⃣ TikTok (PRIORIDADE BAIXA)
**Por que?** Se você quer integração com TikTok

**Tempo:** 5 minutos

**Passos:**
1. Acesse https://developers.tiktok.com/
2. Faça login
3. Crie um novo app
4. Copie:
   - **Client Key**
   - **Client Secret**
5. Adicione ao `.env.local`:
```
TIKTOK_CLIENT_KEY=cole_aqui
TIKTOK_CLIENT_SECRET=cole_aqui
```

---

### 6️⃣ GitHub (PRIORIDADE BAIXA - OPCIONAL)
**Por que?** Para integração com GitHub

**Tempo:** 2 minutos

**Passos:**
1. Acesse https://github.com/settings/tokens
2. Clique em **Generate new token**
3. Selecione escopos: `repo`, `admin:repo_hook`
4. Copie o token
5. Adicione ao `.env.local`:
```
GITHUB_TOKEN=cole_aqui
```

---

### 7️⃣ Docker (PRIORIDADE BAIXA - OPCIONAL)
**Por que?** Para usar Terraform

**Tempo:** 15 minutos

**Passos:**
1. Baixe https://www.docker.com/products/docker-desktop
2. Instale
3. Reinicie o computador
4. Verifique: `docker --version`

---

### 8️⃣ Supabase Local (PRIORIDADE BAIXA - OPCIONAL)
**Por que?** Para desenvolvimento local

**Tempo:** 5 minutos

**Passos:**
1. Execute: `npx supabase start`
2. Pronto!

---

## 📝 Exemplo Completo do `.env.local`

```
# ============================================
# MCP Servers Configuration
# ============================================

# Postman API ✅
POSTMAN_API_KEY=your_postman_api_key_here

# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_PROFILE=default

# Stripe API Keys
# Obter em: https://dashboard.stripe.com/apikeys
STRIPE_PUBLIC_KEY=your_public_key_here
STRIPE_SECRET_KEY=your_secret_key_here

# Supabase
# Obter em: https://app.supabase.com/project/[project-id]/settings/api
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Cloud
# Obter em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# Meta/Facebook
META_APP_ID=1234567890123456
META_APP_SECRET=abcdefghijklmnopqrstuvwxyz123456

# TikTok
TIKTOK_CLIENT_KEY=aw123456789abcdef
TIKTOK_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456

# GitHub
GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456
```

---

## ✅ Checklist Final

- [ ] Abri `.kiro/SETUP_CREDENTIALS.md`
- [ ] Obtive AWS credentials
- [ ] Obtive Stripe keys
- [ ] Obtive Google Cloud credentials
- [ ] Obtive Meta/Facebook credentials
- [ ] Obtive TikTok credentials (opcional)
- [ ] Obtive GitHub token (opcional)
- [ ] Instalei Docker (opcional)
- [ ] Adicionei todas as chaves ao `.env.local`
- [ ] Salvei o `.env.local`
- [ ] Reiniciei o Kiro
- [ ] Verifiquei os logs de conexão MCP

---

## 🎉 Pronto!

Quando terminar:
1. Todas as APIs estarão disponíveis
2. Você terá acesso máximo ao Kiro
3. Poderá usar qualquer serviço MCP

---

## 🆘 Problemas Comuns

### "Chave inválida"
- Verifique se copiou a chave completa
- Verifique se não tem espaços extras
- Tente gerar uma nova chave

### "Conexão recusada"
- Verifique se a chave está correta
- Verifique se o serviço está ativo
- Tente reiniciar o Kiro

### "Permissão negada"
- Verifique se a chave tem as permissões corretas
- Tente gerar uma nova chave com mais permissões

---

## 📞 Precisa de Ajuda?

1. Consulte `SETUP_CREDENTIALS.md` para instruções detalhadas
2. Acesse o link do serviço fornecido
3. Siga os passos passo a passo

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca compartilhe suas chaves
- Nunca faça commit do `.env.local` no Git
- Use `.env.local` apenas localmente
- Para produção, use variáveis de ambiente seguras
- Considere usar um gerenciador de senhas

---

## 🚀 Vamos Começar!

Escolha uma das opções:

### Opção 1: Rápido (15 min)
- AWS apenas

### Opção 2: Completo (45 min)
- AWS + Stripe + Google + Meta + TikTok + GitHub

### Opção 3: Máximo (60 min)
- Tudo + Docker + Supabase Local

Qual você escolhe? 🎯

