# Deploy Rápido em 5 Minutos

## Stack Recomendada: Vercel + Railway

### Pré-requisitos
- Conta GitHub
- Repositório público ou privado

---

## 1️⃣ Deploy Frontend (Vercel)

### Passo 1: Conectar Vercel

```bash
# Opção A: Via CLI
npm install -g vercel
vercel login
vercel

# Opção B: Via Dashboard
# 1. Ir para https://vercel.com
# 2. Clicar "New Project"
# 3. Selecionar repositório GitHub
# 4. Clicar "Import"
```

### Passo 2: Configurar Variáveis

No dashboard Vercel, ir para **Settings > Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://seu-backend-railway.railway.app
```

### Passo 3: Deploy

```bash
vercel --prod
```

✅ **Frontend está online em**: `https://seu-projeto.vercel.app`

---

## 2️⃣ Deploy Backend (Railway)

### Passo 1: Criar Projeto

```bash
# Opção A: Via CLI
npm install -g @railway/cli
railway login
railway init

# Opção B: Via Dashboard
# 1. Ir para https://railway.app
# 2. Clicar "New Project"
# 3. Selecionar "Deploy from GitHub"
# 4. Selecionar repositório
```

### Passo 2: Criar Banco de Dados

No dashboard Railway:

```
1. Clicar "New"
2. Selecionar "PostgreSQL"
3. Railway cria automaticamente
```

### Passo 3: Configurar Variáveis

Railway > Variables:

```
NODE_ENV = production
PORT = 3001
DATABASE_URL = (gerado automaticamente)
CORS_ORIGIN = https://seu-projeto.vercel.app
JWT_SECRET = sua_chave_secreta_aqui
```

### Passo 4: Deploy

```bash
railway up
```

✅ **Backend está online em**: `https://seu-backend-railway.railway.app`

---

## 3️⃣ Conectar Frontend ao Backend

### No Vercel Dashboard:

```
Settings > Environment Variables

NEXT_PUBLIC_API_URL = https://seu-backend-railway.railway.app
```

### Redeploy:

```bash
vercel --prod
```

---

## 4️⃣ Configurar Domínio Customizado (Opcional)

### Vercel

```
1. Settings > Domains
2. Adicionar seu domínio
3. Apontar CNAME para vercel.com
```

### Railway

```
1. Settings > Custom Domain
2. Adicionar seu domínio
3. Apontar CNAME para railway.app
```

---

## 5️⃣ Testar Tudo

```bash
# Testar frontend
curl https://seu-projeto.vercel.app

# Testar backend
curl https://seu-backend-railway.railway.app/health

# Testar conexão frontend-backend
# Abrir console do navegador e verificar requisições
```

---

## Troubleshooting Rápido

### ❌ "Cannot find module"

```bash
npm ci
npm run build
vercel --prod
```

### ❌ "Connection refused"

```bash
# Verificar DATABASE_URL no Railway
railway variables

# Verificar CORS_ORIGIN
# Deve ser exatamente: https://seu-projeto.vercel.app
```

### ❌ "CORS error"

```bash
# No backend, adicionar:
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### ❌ "Aplicação muito lenta"

```bash
# Verificar logs
railway logs

# Aumentar recursos se necessário
# Railway > Settings > Plan
```

---

## Monitoramento

### Ver Logs

```bash
# Vercel
vercel logs

# Railway
railway logs --follow
```

### Métricas

- **Vercel**: https://vercel.com/dashboard
- **Railway**: https://railway.app/dashboard

---

## Próximas Etapas

- [ ] Configurar domínio customizado
- [ ] Ativar HTTPS (automático)
- [ ] Configurar backups do banco
- [ ] Ativar monitoramento de erros
- [ ] Configurar alertas

---

## Custos

| Serviço | Free Tier | Custo |
|---------|-----------|-------|
| Vercel | Ilimitado | $0 |
| Railway | $5 crédito/mês | $0 |
| **Total** | | **$0** |

🎉 **Seu app está online e gratuito!**
