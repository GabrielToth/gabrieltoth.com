# Guia Completo de Configuração de APIs

Este guia fornece instruções passo a passo detalhadas para ativar e configurar as APIs necessárias para o módulo de upload de vídeos multi-plataforma.

## Índice

1. [YouTube API (Google Cloud)](#1-youtube-api-google-cloud)
2. [Facebook API (Meta for Developers)](#2-facebook-api-meta-for-developers)
3. [Instagram API (Meta for Developers)](#3-instagram-api-meta-for-developers)
4. [TikTok API (TikTok for Developers)](#4-tiktok-api-tiktok-for-developers)
5. [Configuração de Variáveis de Ambiente](#5-configuração-de-variáveis-de-ambiente)
6. [Testando as Configurações](#6-testando-as-configurações)

---

## 1. YouTube API (Google Cloud)

### Passo 1.1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. No topo da página, clique em **"Select a project"** (Selecionar um projeto)
4. Clique em **"NEW PROJECT"** (NOVO PROJETO)
5. Preencha:
   - **Project name**: `video-upload-platform` (ou nome de sua preferência)
   - **Organization**: Deixe como está (opcional)
6. Clique em **"CREATE"** (CRIAR)
7. Aguarde alguns segundos até o projeto ser criado

### Passo 1.2: Ativar YouTube Data API v3

1. Com o projeto selecionado, vá para o menu lateral esquerdo
2. Clique em **"APIs & Services"** > **"Library"** (Biblioteca)
3. Na barra de pesquisa, digite: `YouTube Data API v3`
4. Clique no resultado **"YouTube Data API v3"**
5. Clique no botão azul **"ENABLE"** (ATIVAR)
6. Aguarde a ativação (alguns segundos)

### Passo 1.3: Configurar OAuth Consent Screen

1. No menu lateral, clique em **"OAuth consent screen"**
2. Selecione **"External"** (para permitir qualquer usuário com conta Google)
3. Clique em **"CREATE"** (CRIAR)
4. Preencha as informações obrigatórias:
   - **App name**: `Video Upload Platform`
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
5. Clique em **"SAVE AND CONTINUE"** (SALVAR E CONTINUAR)

### Passo 1.4: Adicionar Scopes (Permissões)

1. Na seção **"Scopes"**, clique em **"ADD OR REMOVE SCOPES"**
2. Na lista, procure e marque os seguintes scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
3. Clique em **"UPDATE"** (ATUALIZAR)
4. Clique em **"SAVE AND CONTINUE"** (SALVAR E CONTINUAR)

### Passo 1.5: Adicionar Test Users (Modo de Teste)

1. Na seção **"Test users"**, clique em **"ADD USERS"**
2. Adicione os emails das contas Google que você usará para testar
3. Clique em **"SAVE"** (SALVAR)
4. Clique em **"SAVE AND CONTINUE"** (SALVAR E CONTINUAR)
5. Revise as informações e clique em **"BACK TO DASHBOARD"**

### Passo 1.6: Criar Credenciais OAuth 2.0

1. No menu lateral, clique em **"Credentials"** (Credenciais)
2. Clique em **"+ CREATE CREDENTIALS"** (CRIAR CREDENCIAIS)
3. Selecione **"OAuth client ID"**
4. Em **"Application type"**, selecione **"Web application"**
5. Preencha:
   - **Name**: `Video Upload Web Client`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-dominio.com` (para produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/oauth/callback?platform=youtube`
     - `https://seu-dominio.com/api/oauth/callback?platform=youtube`
6. Clique em **"CREATE"** (CRIAR)
7. **IMPORTANTE**: Copie e salve:
   - **Client ID** (algo como: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (algo como: `GOCSPX-abc123xyz`)

### Resumo YouTube

✅ **Scopes necessários**:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

✅ **Credenciais obtidas**:
- Client ID
- Client Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=youtube`



---

## 2. Facebook API (Meta for Developers)

### Passo 2.1: Criar Conta no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Clique em **"Get Started"** (Começar) no canto superior direito
3. Faça login com sua conta Facebook
4. Complete o registro como desenvolvedor (aceite os termos)

### Passo 2.2: Criar um App

1. No painel, clique em **"My Apps"** (Meus Apps) no topo
2. Clique em **"Create App"** (Criar App)
3. Selecione o tipo: **"Business"** (Negócios)
4. Clique em **"Next"** (Próximo)
5. Preencha:
   - **App name**: `Video Upload Platform`
   - **App contact email**: Seu email
6. Clique em **"Create app"** (Criar app)
7. Complete a verificação de segurança (CAPTCHA)

### Passo 2.3: Configurar Facebook Login

1. No painel do app, procure por **"Facebook Login"** nos produtos
2. Clique em **"Set Up"** (Configurar)
3. Selecione **"Web"** como plataforma
4. Em **"Site URL"**, adicione:
   - `http://localhost:3000` (desenvolvimento)
   - `https://seu-dominio.com` (produção)
5. Clique em **"Save"** (Salvar)

### Passo 2.4: Configurar OAuth Redirect URIs

1. No menu lateral, vá para **"Facebook Login"** > **"Settings"** (Configurações)
2. Em **"Valid OAuth Redirect URIs"**, adicione:
   - `http://localhost:3000/api/oauth/callback?platform=facebook`
   - `https://seu-dominio.com/api/oauth/callback?platform=facebook`
3. Clique em **"Save Changes"** (Salvar Alterações)

### Passo 2.5: Adicionar Permissões (Permissions)

1. No menu lateral, vá para **"App Review"** > **"Permissions and Features"**
2. Procure e solicite as seguintes permissões:
   - `pages_manage_posts` - Para publicar vídeos em páginas
   - `pages_read_engagement` - Para ler engajamento
   - `pages_show_list` - Para listar páginas do usuário
3. Para cada permissão, clique em **"Request"** (Solicitar)
4. **NOTA**: Algumas permissões requerem revisão do Facebook (pode levar dias)

### Passo 2.6: Obter Credenciais

1. No menu lateral, vá para **"Settings"** > **"Basic"** (Configurações Básicas)
2. **IMPORTANTE**: Copie e salve:
   - **App ID** (algo como: `123456789012345`)
   - **App Secret** (clique em "Show" para ver, algo como: `abc123def456ghi789`)

### Passo 2.7: Mudar para Modo de Desenvolvimento

1. No topo do painel, você verá o status do app
2. Se estiver em **"Development"** (Desenvolvimento), está correto
3. Para testes, mantenha em modo de desenvolvimento
4. Para produção, você precisará enviar o app para revisão

### Resumo Facebook

✅ **Permissões necessárias**:
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_show_list`

✅ **Credenciais obtidas**:
- App ID
- App Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=facebook`

---

## 3. Instagram API (Meta for Developers)

**IMPORTANTE**: Instagram API usa o mesmo app do Facebook. Você NÃO precisa criar um novo app.

### Passo 3.1: Adicionar Instagram ao App Existente

1. No mesmo app criado para Facebook, vá para o painel
2. Procure por **"Instagram"** nos produtos disponíveis
3. Clique em **"Set Up"** (Configurar) no produto **"Instagram Graph API"**

### Passo 3.2: Configurar Instagram Basic Display

1. No menu lateral, vá para **"Instagram"** > **"Basic Display"**
2. Clique em **"Create New App"** (Criar Novo App)
3. Preencha:
   - **Display Name**: `Video Upload Platform`
4. Em **"Valid OAuth Redirect URIs"**, adicione:
   - `http://localhost:3000/api/oauth/callback?platform=instagram`
   - `https://seu-dominio.com/api/oauth/callback?platform=instagram`
5. Em **"Deauthorize Callback URL"**, adicione:
   - `http://localhost:3000/api/oauth/deauthorize`
6. Em **"Data Deletion Request URL"**, adicione:
   - `http://localhost:3000/api/oauth/data-deletion`
7. Clique em **"Save Changes"** (Salvar Alterações)

### Passo 3.3: Adicionar Permissões Instagram

1. Vá para **"App Review"** > **"Permissions and Features"**
2. Procure e solicite:
   - `instagram_basic` - Acesso básico ao perfil
   - `instagram_content_publish` - Para publicar conteúdo
3. Clique em **"Request"** para cada permissão

### Passo 3.4: Conectar Conta Instagram Business

**IMPORTANTE**: Para publicar vídeos, você precisa de uma conta Instagram Business conectada a uma página Facebook.

1. Converta sua conta Instagram para Business:
   - Abra o app Instagram no celular
   - Vá para **Configurações** > **Conta**
   - Toque em **Mudar para conta profissional**
   - Selecione **Empresa**
   - Conecte a uma página Facebook
2. Anote o **Instagram Business Account ID** (você precisará dele)

### Passo 3.5: Obter Instagram App ID e Secret

1. No menu lateral, vá para **"Instagram"** > **"Basic Display"**
2. **IMPORTANTE**: Copie e salve:
   - **Instagram App ID**
   - **Instagram App Secret** (clique em "Show")

### Resumo Instagram

✅ **Permissões necessárias**:
- `instagram_basic`
- `instagram_content_publish`

✅ **Credenciais obtidas**:
- Instagram App ID (mesmo que Facebook App ID)
- Instagram App Secret (mesmo que Facebook App Secret)

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=instagram`

✅ **Requisitos adicionais**:
- Conta Instagram Business
- Página Facebook conectada



---

## 4. TikTok API (TikTok for Developers)

### Passo 4.1: Criar Conta no TikTok for Developers

1. Acesse [TikTok for Developers](https://developers.tiktok.com/)
2. Clique em **"Register"** (Registrar) no canto superior direito
3. Faça login com sua conta TikTok (ou crie uma)
4. Complete o registro como desenvolvedor

### Passo 4.2: Criar um App

1. No painel, clique em **"Manage apps"** (Gerenciar apps)
2. Clique em **"Connect an app"** (Conectar um app)
3. Selecione **"Create a new app"** (Criar um novo app)
4. Preencha:
   - **App name**: `Video Upload Platform`
   - **App description**: `Platform for uploading videos to multiple social media`
5. Clique em **"Submit"** (Enviar)

### Passo 4.3: Configurar App Settings

1. Após criar o app, clique nele para abrir as configurações
2. Vá para **"Basic information"** (Informações básicas)
3. Em **"Redirect domain"**, adicione:
   - `localhost:3000` (desenvolvimento)
   - `seu-dominio.com` (produção)
4. Clique em **"Save"** (Salvar)

### Passo 4.4: Adicionar Scopes (Permissões)

1. Vá para a aba **"Add products"** (Adicionar produtos)
2. Procure por **"Login Kit"** e clique em **"Apply"** (Solicitar)
3. Procure por **"Content Posting API"** e clique em **"Apply"** (Solicitar)
4. Selecione os seguintes scopes:
   - `user.info.basic` - Informações básicas do usuário
   - `video.upload` - Upload de vídeos
   - `video.publish` - Publicação de vídeos
5. Preencha o formulário de solicitação explicando o uso
6. Clique em **"Submit"** (Enviar)
7. **NOTA**: A aprovação pode levar de 1 a 7 dias úteis

### Passo 4.5: Configurar Redirect URIs

1. Vá para **"Login Kit"** > **"Settings"**
2. Em **"Redirect URI"**, adicione:
   - `http://localhost:3000/api/oauth/callback?platform=tiktok`
   - `https://seu-dominio.com/api/oauth/callback?platform=tiktok`
3. Clique em **"Save"** (Salvar)

### Passo 4.6: Obter Credenciais

1. Vá para **"Basic information"**
2. **IMPORTANTE**: Copie e salve:
   - **Client Key** (algo como: `aw123abc456def`)
   - **Client Secret** (clique em "Show", algo como: `xyz789ghi012jkl`)

### Passo 4.7: Aguardar Aprovação

1. Após solicitar os scopes, aguarde a aprovação do TikTok
2. Você receberá um email quando for aprovado
3. Enquanto aguarda, você pode desenvolver usando dados mockados

### Resumo TikTok

✅ **Scopes necessários**:
- `user.info.basic`
- `video.upload`
- `video.publish`

✅ **Credenciais obtidas**:
- Client Key
- Client Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=tiktok`

⚠️ **IMPORTANTE**: Requer aprovação (1-7 dias úteis)

---

## 5. Configuração de Variáveis de Ambiente

Após obter todas as credenciais, configure o arquivo `.env.local` na raiz do projeto:

```bash
# App Configuration
APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/video_upload_db

# Redis (para fila e rate limiting)
REDIS_URL=redis://localhost:6379

# Encryption Key (gere uma chave aleatória de 32 bytes)
ENCRYPTION_KEY=your-32-byte-encryption-key-here-change-this

# YouTube API (Google Cloud)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# Facebook API (Meta for Developers)
META_APP_ID=123456789012345
META_APP_SECRET=abc123def456ghi789

# Instagram API (usa as mesmas credenciais do Facebook)
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=abc123def456ghi789

# TikTok API (TikTok for Developers)
TIKTOK_CLIENT_KEY=aw123abc456def
TIKTOK_CLIENT_SECRET=xyz789ghi012jkl

# File Storage (opcional, para produção)
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_S3_BUCKET=your-bucket-name
# AWS_REGION=us-east-1
```

### Como Gerar a ENCRYPTION_KEY

Execute no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e cole em `ENCRYPTION_KEY`.



---

## 6. Testando as Configurações

### Passo 6.1: Verificar Variáveis de Ambiente

Crie um script de teste `scripts/test-env.ts`:

```typescript
// Verifica se todas as variáveis estão configuradas
const requiredEnvVars = [
  'APP_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'META_APP_ID',
  'META_APP_SECRET',
  'INSTAGRAM_APP_ID',
  'INSTAGRAM_APP_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
} else {
  console.log('✅ Todas as variáveis de ambiente estão configuradas!');
}
```

Execute:

```bash
npx tsx scripts/test-env.ts
```

### Passo 6.2: Testar Conexão com Banco de Dados

```bash
# Instale o PostgreSQL localmente ou use Docker
docker run --name postgres-video-upload -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Teste a conexão
psql postgresql://user:password@localhost:5432/video_upload_db
```

### Passo 6.3: Testar Conexão com Redis

```bash
# Instale o Redis localmente ou use Docker
docker run --name redis-video-upload -p 6379:6379 -d redis

# Teste a conexão
redis-cli ping
# Deve retornar: PONG
```

### Passo 6.4: Testar OAuth Flow

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse no navegador:
```
http://localhost:3000/api/oauth/authorize?platform=youtube
```

3. Você deve ser redirecionado para a tela de consentimento do Google
4. Após autorizar, você deve ser redirecionado de volta para sua aplicação

5. Repita para outras plataformas:
```
http://localhost:3000/api/oauth/authorize?platform=facebook
http://localhost:3000/api/oauth/authorize?platform=instagram
http://localhost:3000/api/oauth/authorize?platform=tiktok
```

---

## Troubleshooting (Resolução de Problemas)

### Erro: "redirect_uri_mismatch"

**Causa**: A URI de redirecionamento não está configurada corretamente.

**Solução**:
1. Verifique se a URI no código corresponde EXATAMENTE à configurada no console da plataforma
2. Inclua o protocolo (`http://` ou `https://`)
3. Inclua a porta se estiver em desenvolvimento (`localhost:3000`)
4. Não adicione barra final (`/`)

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos.

**Solução**:
1. Verifique se copiou as credenciais corretamente
2. Verifique se não há espaços extras no `.env.local`
3. Reinicie o servidor após alterar `.env.local`

### Erro: "insufficient_permissions"

**Causa**: Scopes/permissões não foram aprovados.

**Solução**:
1. Verifique se solicitou todas as permissões necessárias
2. Para Facebook/Instagram, aguarde aprovação da revisão
3. Para TikTok, aguarde aprovação do app (1-7 dias)

### Erro: "access_denied"

**Causa**: Usuário negou permissões ou app não está em modo de teste.

**Solução**:
1. Para Google: Adicione o usuário como "Test user" no OAuth consent screen
2. Para Facebook: Mantenha o app em modo "Development" durante testes
3. Para TikTok: Aguarde aprovação do app

---

## Próximos Passos

Após configurar todas as APIs:

1. ✅ Execute as migrations do banco de dados
2. ✅ Inicie o servidor de desenvolvimento
3. ✅ Teste o fluxo OAuth para cada plataforma
4. ✅ Teste o upload de um vídeo de teste
5. ✅ Verifique os logs de auditoria no banco de dados

## Recursos Adicionais

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [TikTok API Documentation](https://developers.tiktok.com/doc)

---

**Última atualização**: 2026-03-05
