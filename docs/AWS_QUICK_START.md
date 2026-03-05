# AWS Deploy em 10 Minutos

## Stack: Amplify + Lambda + RDS

---

## 1️⃣ Criar Conta AWS (2 min)

```bash
# 1. https://aws.amazon.com
# 2. "Create an AWS Account"
# 3. Preencher dados
# 4. Adicionar cartão (não será cobrado)
# 5. Fazer login
```

✅ **Conta criada**

---

## 2️⃣ Deploy Frontend com Amplify (2 min)

```bash
# 1. Ir para: https://console.aws.amazon.com/amplify/

# 2. Clicar "New app" > "Host web app"

# 3. Selecionar GitHub

# 4. Autorizar AWS Amplify

# 5. Selecionar seu repositório

# 6. Selecionar branch: main

# 7. Clicar "Save and deploy"
```

**Amplify detecta Next.js automaticamente**

✅ **Frontend online em**: `https://seu-app.amplifyapp.com`

---

## 3️⃣ Criar Banco de Dados RDS (3 min)

```bash
# 1. Ir para: https://console.aws.amazon.com/rds/

# 2. Clicar "Create database"

# 3. Selecionar "PostgreSQL"

# 4. Selecionar "Free tier"

# 5. Configurar:
#    - DB instance identifier: seu-app-db
#    - Master username: postgres
#    - Master password: SenhaForte123!
#    - DB instance class: db.t3.micro
#    - Storage: 20 GB
#    - Multi-AZ: No

# 6. Clicar "Create database"
```

**Aguardar 5-10 minutos para criar**

✅ **Banco criado**

---

## 4️⃣ Deploy Backend com Lambda (3 min)

### Instalar Serverless Framework

```bash
npm install -g serverless
npm install serverless-plugin-typescript serverless-http aws-lambda
```

### Criar `serverless.yml`

```yaml
service: seu-app-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    DATABASE_URL: postgresql://postgres:SenhaForte123!@seu-db-endpoint.rds.amazonaws.com:5432/seu_app_db
    NODE_ENV: production

functions:
  api:
    handler: src/backend/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 512

plugins:
  - serverless-plugin-typescript
```

### Configurar Credenciais AWS

```bash
# 1. Ir para: https://console.aws.amazon.com/iam/

# 2. Users > Create user

# 3. Nome: seu-app-deploy

# 4. Attach policies: AdministratorAccess

# 5. Create access key

# 6. Copiar Access Key ID e Secret Access Key

# 7. Executar:
serverless config credentials --provider aws \
  --key YOUR_ACCESS_KEY_ID \
  --secret YOUR_SECRET_ACCESS_KEY
```

### Deploy

```bash
serverless deploy --stage prod
```

**Resultado:**
```
endpoint: https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
```

✅ **Backend online**

---

## 5️⃣ Conectar Frontend ao Backend (1 min)

### No Amplify Console

```
1. Ir para seu app
2. Clicar "Environment variables"
3. Adicionar:
   NEXT_PUBLIC_API_URL = https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
4. Clicar "Save"
5. Amplify faz redeploy automático
```

✅ **Tudo conectado!**

---

## 6️⃣ Testar Tudo

```bash
# Testar frontend
curl https://seu-app.amplifyapp.com

# Testar backend
curl https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod/health

# Testar no navegador
# Abrir console e verificar requisições
```

---

## Custos

| Serviço | Custo |
|---------|-------|
| Amplify | $0 (free tier) |
| Lambda | $0 (1M req/mês) |
| API Gateway | $0 (1M req/mês) |
| RDS | $0 (750h/mês) |
| **Total** | **$0** 🎉 |

---

## Próximas Etapas

- [ ] Configurar domínio customizado
- [ ] Ativar HTTPS (automático)
- [ ] Configurar backups RDS
- [ ] Ativar CloudWatch monitoring
- [ ] Configurar CI/CD com GitHub Actions

---

## Troubleshooting Rápido

### ❌ "Cannot find module"

```bash
npm ci
npm run build
serverless deploy --stage prod
```

### ❌ "Connection refused"

```bash
# Verificar security group do RDS
# RDS > Databases > seu-app-db > Security group rules
# Adicionar regra PostgreSQL porta 5432
```

### ❌ "CORS error"

```typescript
// No backend
import cors from 'cors'
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### ❌ "Lambda timeout"

```yaml
# Em serverless.yml
timeout: 60  # aumentar para 60 segundos
```

---

## Monitoramento

```bash
# Ver logs Lambda
aws logs tail /aws/lambda/seu-app-api --follow

# Ver logs Amplify
# Amplify Console > Deployments > Build logs

# Dashboard CloudWatch
# https://console.aws.amazon.com/cloudwatch/
```

---

## Referências Rápidas

- [AWS Console](https://console.aws.amazon.com/)
- [Amplify Docs](https://docs.amplify.aws/)
- [Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [Serverless Framework](https://www.serverless.com/)

🚀 **Seu app está online na AWS!**
