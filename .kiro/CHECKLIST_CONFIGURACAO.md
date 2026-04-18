# ✅ Checklist de Configuração MCP

## 📋 Instruções

Marque cada item conforme você completa. Use `- [x]` para marcar como feito.

---

## 🔴 PRIORIDADE ALTA - AWS

### Obter Credenciais
- [ ] Acessei https://console.aws.amazon.com/iam/
- [ ] Fiz login com minha conta AWS
- [ ] Cliquei em **Users** (Usuários)
- [ ] Selecionei meu usuário
- [ ] Fui para **Security credentials** (Credenciais de segurança)
- [ ] Cliquei em **Create access key** (Criar chave de acesso)
- [ ] Copiei **Access Key ID**
- [ ] Copiei **Secret Access Key**

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Procurei pela seção `# MCP Servers Configuration`
- [ ] Adicionei `AWS_ACCESS_KEY_ID=...`
- [ ] Adicionei `AWS_SECRET_ACCESS_KEY=...`
- [ ] Adicionei `AWS_REGION=us-east-1`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] Verifiquei os logs de conexão MCP
- [ ] AWS está conectado ✅

---

## 🟡 PRIORIDADE MÉDIA - STRIPE

### Obter Chaves
- [ ] Acessei https://dashboard.stripe.com/
- [ ] Fiz login
- [ ] Fui para **Developers** → **API keys**
- [ ] Copiei **Publishable key** (pk_...)
- [ ] Copiei **Secret key** (sk_...)

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Adicionei `STRIPE_PUBLIC_KEY=pk_...`
- [ ] Adicionei `STRIPE_SECRET_KEY=sk_...`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] Stripe está conectado ✅

---

## 🟡 PRIORIDADE MÉDIA - GOOGLE CLOUD

### Criar Projeto
- [ ] Acessei https://console.cloud.google.com/
- [ ] Criei um novo projeto (ou usei um existente)
- [ ] Ativei **YouTube Data API v3**
- [ ] Ativei **Gmail API**
- [ ] Ativei **Google Drive API**

### Obter Credenciais
- [ ] Fui para **Credentials** (Credenciais)
- [ ] Cliquei em **Create Credentials** → **OAuth 2.0 Client ID**
- [ ] Copiei **Client ID**
- [ ] Copiei **Client Secret**

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Adicionei `GOOGLE_CLIENT_ID=...`
- [ ] Adicionei `GOOGLE_CLIENT_SECRET=...`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] Google Cloud está conectado ✅

---

## 🟡 PRIORIDADE MÉDIA - META/FACEBOOK

### Criar App
- [ ] Acessei https://developers.facebook.com/
- [ ] Fiz login
- [ ] Criei um novo app (ou usei um existente)

### Obter Credenciais
- [ ] Fui para **Settings** → **Basic**
- [ ] Copiei **App ID**
- [ ] Copiei **App Secret**

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Adicionei `META_APP_ID=...`
- [ ] Adicionei `META_APP_SECRET=...`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] Meta/Facebook está conectado ✅

---

## 🟢 PRIORIDADE BAIXA - TIKTOK (OPCIONAL)

### Criar App
- [ ] Acessei https://developers.tiktok.com/
- [ ] Fiz login
- [ ] Criei um novo app

### Obter Credenciais
- [ ] Copiei **Client Key**
- [ ] Copiei **Client Secret**

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Adicionei `TIKTOK_CLIENT_KEY=...`
- [ ] Adicionei `TIKTOK_CLIENT_SECRET=...`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] TikTok está conectado ✅

---

## 🟢 PRIORIDADE BAIXA - GITHUB (OPCIONAL)

### Obter Token
- [ ] Acessei https://github.com/settings/tokens
- [ ] Cliquei em **Generate new token**
- [ ] Selecionei escopos: `repo`, `admin:repo_hook`
- [ ] Copiei o token

### Adicionar ao .env.local
- [ ] Abri o arquivo `.env.local`
- [ ] Adicionei `GITHUB_TOKEN=...`
- [ ] Salvei o arquivo (Ctrl+S)

### Verificar
- [ ] Reiniciei o Kiro
- [ ] GitHub está conectado ✅

---

## 🟢 PRIORIDADE BAIXA - DOCKER (OPCIONAL)

### Instalar
- [ ] Baixei https://www.docker.com/products/docker-desktop
- [ ] Instalei o Docker Desktop
- [ ] Reiniciei o computador
- [ ] Verifiquei: `docker --version`

### Verificar
- [ ] Docker está instalado ✅
- [ ] Terraform MCP está conectado ✅

---

## 🟢 PRIORIDADE BAIXA - SUPABASE LOCAL (OPCIONAL)

### Setup
- [ ] Executei: `npx supabase start`
- [ ] Aguardei a inicialização
- [ ] Verifiquei que está rodando

### Verificar
- [ ] Supabase Local está conectado ✅

---

## 🎯 RESUMO FINAL

### Configuração Mínima (15 min)
- [x] ✅ Postman (já feito)
- [x] ✅ Supabase Hosted (já funcionando)
- [ ] AWS

### Configuração Completa (45 min)
- [x] ✅ Postman (já feito)
- [x] ✅ Supabase Hosted (já funcionando)
- [ ] AWS
- [ ] Stripe
- [ ] Google Cloud
- [ ] Meta/Facebook
- [ ] TikTok
- [ ] GitHub

### Configuração Máxima (60 min)
- [x] ✅ Postman (já feito)
- [x] ✅ Supabase Hosted (já funcionando)
- [ ] AWS
- [ ] Stripe
- [ ] Google Cloud
- [ ] Meta/Facebook
- [ ] TikTok
- [ ] GitHub
- [ ] Docker
- [ ] Supabase Local

---

## 📊 Progresso

**Concluído:** 2/10 (20%)  
**Em Progresso:** 0/10 (0%)  
**Pendente:** 8/10 (80%)  

---

## 🚀 Próximo Passo

1. Escolha uma configuração acima
2. Siga os passos do checklist
3. Marque cada item conforme completa
4. Quando terminar, reinicie o Kiro

---

## 💡 Dicas

- Comece pelo AWS (prioridade alta)
- Configure um serviço por vez
- Teste cada chave antes de adicionar
- Salve o `.env.local` após cada adição
- Reinicie o Kiro após adicionar chaves

---

## 🎉 Quando Terminar

Todos os serviços MCP estarão disponíveis e você terá acesso máximo ao Kiro!

