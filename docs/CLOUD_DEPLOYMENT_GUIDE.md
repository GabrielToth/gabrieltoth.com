# Guia de Deploy na Cloud com Custo Mínimo

## Resumo Executivo

Para uma aplicação com **baixo volume de usuários** (praticamente nenhum), recomendamos:

- **Frontend**: Vercel (gratuito com plano Free)
- **Backend**: Railway ou Render (free tier com sleep automático)
- **Banco de Dados**: PostgreSQL gerenciado (Railway/Render free tier)
- **Cache**: Redis (opcional, apenas se necessário)
- **Custo Mensal Estimado**: **$0 - $5 USD**

---

## Opção 1: Vercel + Railway (RECOMENDADO)

### Por que essa stack?

- **Vercel**: Melhor para Next.js, deploy automático via Git, free tier generoso
- **Railway**: Banco de dados gratuito, backend simples, pay-as-you-go
- **Custo**: Praticamente zero com free tier

### Passo 1: Deploy Frontend no Vercel

```bash
# 1. Criar conta em https://vercel.com
# 2. Conectar repositório GitHub
# 3. Configurar variáveis de ambiente
```

**Variáveis de Ambiente no Vercel:**

```env
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
NEXT_PUBLIC_ANALYTICS_ID=seu_id
```

**Arquivo `vercel.json` (criar na raiz):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Passo 2: Deploy Backend no Railway

```bash
# 1. Criar conta em https://railway.app
# 2. Conectar repositório GitHub
# 3. Criar novo projeto
# 4. Selecionar "Deploy from GitHub"
```

**Arquivo `railway.json` (criar na raiz):**

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyMaxRetries": 5
  }
}
```

**Arquivo `Dockerfile` (se necessário):**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Passo 3: Banco de Dados PostgreSQL no Railway

```bash
# 1. No dashboard Railway, criar novo serviço
# 2. Selecionar "PostgreSQL"
# 3. Railway gera automaticamente DATABASE_URL
```

**Variáveis de Ambiente no Railway:**

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
PORT=3001
```

### Passo 4: Configurar Variáveis de Ambiente

**No Vercel:**
```
NEXT_PUBLIC_API_URL=https://seu-backend-railway.railway.app
```

**No Railway (Backend):**
```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://seu-dominio.vercel.app
```

---

## Opção 2: Render + Render (Alternativa)

### Por que Render?

- Suporta Node.js, Python, Go
- Free tier com 750 horas/mês
- Banco de dados PostgreSQL gratuito
- Melhor para aplicações mais complexas

### Passo 1: Deploy Frontend no Render

```bash
# 1. Criar conta em https://render.com
# 2. Conectar GitHub
# 3. Criar novo "Static Site"
# 4. Build command: npm run build
# 5. Publish directory: .next
```

### Passo 2: Deploy Backend no Render

```bash
# 1. Criar novo "Web Service"
# 2. Conectar repositório
# 3. Runtime: Node
# 4. Build command: npm install
# 5. Start command: npm run start:prod
```

**Arquivo `render.yaml` (criar na raiz):**

```yaml
services:
  - type: web
    name: api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: postgres
          property: connectionString

databases:
  - name: postgres
    plan: free
```

---

## Opção 3: Netlify + Supabase (Mais Simples)

### Por que essa combinação?

- **Netlify**: Excelente para Next.js, deploy automático
- **Supabase**: PostgreSQL + Auth + Realtime (free tier)
- **Custo**: Totalmente gratuito

### Passo 1: Deploy Frontend no Netlify

```bash
# 1. Criar conta em https://netlify.com
# 2. Conectar GitHub
# 3. Build command: npm run build
# 4. Publish directory: .next
```

**Arquivo `netlify.toml` (criar na raiz):**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "https://seu-backend.railway.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Passo 2: Banco de Dados no Supabase

```bash
# 1. Criar conta em https://supabase.com
# 2. Criar novo projeto
# 3. Copiar DATABASE_URL
# 4. Usar Supabase Auth para login/register
```

**Variáveis de Ambiente:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada
```

---

## Configuração de Domínio Customizado

### Vercel

```bash
# 1. Ir para Settings > Domains
# 2. Adicionar domínio
# 3. Seguir instruções de DNS
# 4. Apontar CNAME para vercel.com
```

### Railway/Render

```bash
# 1. Gerar URL pública automática
# 2. Ou configurar domínio customizado
# 3. Apontar CNAME para o serviço
```

---

## Monitoramento e Logs

### Vercel

```bash
# Logs em tempo real
vercel logs --follow

# Ou via dashboard
# https://vercel.com/dashboard
```

### Railway

```bash
# Logs via CLI
railway logs

# Ou via dashboard
# https://railway.app/dashboard
```

### Render

```bash
# Logs via dashboard
# https://dashboard.render.com
```

---

## Escalabilidade Futura

Se a aplicação crescer:

### Upgrade Vercel
- Plano Pro: $20/mês
- Suporta mais builds e bandwidth

### Upgrade Railway
- Pay-as-you-go: $5-50/mês
- Escala automaticamente

### Upgrade Render
- Plano Starter: $7/mês
- Mais recursos de CPU/RAM

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] CORS configurado corretamente
- [ ] Domínio apontando para o servidor
- [ ] SSL/TLS ativado (automático em todos)
- [ ] Backups do banco de dados configurados
- [ ] Monitoramento de erros ativado
- [ ] Rate limiting configurado
- [ ] Logs centralizados

---

## Troubleshooting

### Erro: "Cannot find module"

```bash
# Solução
npm ci --only=production
npm run build
```

### Erro: "Connection refused"

```bash
# Verificar se DATABASE_URL está correto
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1"
```

### Erro: "CORS error"

```bash
# Adicionar no backend
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### Aplicação muito lenta

```bash
# Verificar logs
railway logs
# ou
render logs

# Aumentar recursos se necessário
```

---

## Estimativa de Custos

| Serviço | Free Tier | Pago |
|---------|-----------|------|
| Vercel | Ilimitado | $20/mês |
| Railway | $5 crédito/mês | Pay-as-you-go |
| Render | 750h/mês | $7/mês |
| Supabase | 500MB DB | $25/mês |
| Netlify | Ilimitado | $19/mês |

**Total Estimado (Free)**: $0 USD
**Total Estimado (Pago)**: $5-50 USD/mês

---

## Próximos Passos

1. Escolher stack (recomendado: Vercel + Railway)
2. Criar contas nos serviços
3. Conectar repositório GitHub
4. Configurar variáveis de ambiente
5. Fazer primeiro deploy
6. Testar fluxo completo
7. Configurar domínio customizado
8. Ativar monitoramento

