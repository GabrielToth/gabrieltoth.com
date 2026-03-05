# Deploy na AWS com Custo Mínimo

## Resumo Executivo

Para uma aplicação com **baixo volume de usuários**, recomendamos:

- **Frontend**: AWS Amplify (gratuito)
- **Backend**: AWS Lambda + API Gateway (free tier: 1M requisições/mês)
- **Banco de Dados**: RDS PostgreSQL (free tier: 750 horas/mês)
- **Storage**: S3 (free tier: 5GB)
- **CDN**: CloudFront (free tier: 1TB/mês)
- **Custo Mensal Estimado**: **$0 - $10 USD**

---

## Arquitetura AWS

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO FINAL                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   CloudFront (CDN)         │
        │   - Cache Global           │
        │   - 1TB/mês free           │
        └────────────┬───────────────┘
                     │
        ┌────────────┴───────────────┐
        │                            │
        ▼                            ▼
   ┌─────────────┐          ┌──────────────────┐
   │ S3 (Static) │          │ API Gateway      │
   │ - HTML/CSS  │          │ - REST API       │
   │ - 5GB free  │          │ - 1M req/mês     │
   └─────────────┘          └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Lambda Functions │
                            │ - Node.js 20     │
                            │ - 1M req/mês     │
                            │ - 400k GB-sec    │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ RDS PostgreSQL   │
                            │ - 750 horas/mês  │
                            │ - 20GB storage   │
                            │ - Multi-AZ       │
                            └──────────────────┘
```

---

## Passo 1: Criar Conta AWS

```bash
# 1. Ir para https://aws.amazon.com
# 2. Clicar "Create an AWS Account"
# 3. Preencher dados pessoais
# 4. Adicionar cartão de crédito (não será cobrado no free tier)
# 5. Verificar email
# 6. Fazer login no console
```

**Verificar Free Tier:**
- Ir para: https://console.aws.amazon.com/billing/home
- Clicar em "Free Tier"
- Verificar saldo de créditos

---

## Passo 2: Deploy Frontend com AWS Amplify

### 2.1 Conectar Repositório

```bash
# 1. Ir para AWS Amplify Console
# https://console.aws.amazon.com/amplify/

# 2. Clicar "New app" > "Host web app"

# 3. Selecionar GitHub

# 4. Autorizar AWS Amplify no GitHub

# 5. Selecionar repositório

# 6. Selecionar branch (main)
```

### 2.2 Configurar Build

**Amplify detecta Next.js automaticamente**

Se precisar customizar, criar `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 2.3 Variáveis de Ambiente

No Amplify Console:

```
App settings > Environment variables

NEXT_PUBLIC_API_URL = https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_REGION = us-east-1
```

### 2.4 Deploy

```bash
# Amplify faz deploy automático ao fazer push
git push origin main

# Ou via CLI
npm install -g @aws-amplify/cli
amplify init
amplify publish
```

✅ **Frontend online em**: `https://seu-app.amplifyapp.com`

---

## Passo 3: Deploy Backend com Lambda + API Gateway

### 3.1 Preparar Código

**Arquivo `src/backend/lambda.ts`:**

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda'
import app from './app'

// Converter Express para Lambda
const serverlessHttp = require('serverless-http')

export const handler: APIGatewayProxyHandler = serverlessHttp(app)
```

**Arquivo `serverless.yml`:**

```yaml
service: seu-app-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    DATABASE_URL: ${ssm:/seu-app/database-url}
    JWT_SECRET: ${ssm:/seu-app/jwt-secret}
    NODE_ENV: production
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - ssm:GetParameter
          Resource: arn:aws:ssm:us-east-1:*:parameter/seu-app/*

functions:
  api:
    handler: src/backend/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
    timeout: 30
    memorySize: 512

plugins:
  - serverless-plugin-typescript
  - serverless-offline
  - serverless-dynamodb-local
```

### 3.2 Instalar Dependências

```bash
npm install serverless serverless-plugin-typescript serverless-offline
npm install aws-lambda aws-sdk
npm install serverless-http
```

### 3.3 Deploy com Serverless Framework

```bash
# Instalar Serverless Framework
npm install -g serverless

# Configurar credenciais AWS
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# Deploy
serverless deploy --stage prod

# Resultado:
# endpoint: https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
```

✅ **Backend online em**: `https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod`

---

## Passo 4: Banco de Dados RDS PostgreSQL

### 4.1 Criar Instância RDS

```bash
# 1. Ir para RDS Console
# https://console.aws.amazon.com/rds/

# 2. Clicar "Create database"

# 3. Selecionar "PostgreSQL"

# 4. Selecionar "Free tier"

# 5. Configurar:
#    - DB instance identifier: seu-app-db
#    - Master username: postgres
#    - Master password: SenhaForte123!
#    - DB instance class: db.t3.micro (free)
#    - Storage: 20 GB (free)
#    - Multi-AZ: No (para economizar)
```

### 4.2 Configurar Segurança

```bash
# 1. Ir para Security Groups
# 2. Editar inbound rules
# 3. Adicionar regra:
#    - Type: PostgreSQL
#    - Port: 5432
#    - Source: 0.0.0.0/0 (ou seu IP)
```

### 4.3 Conectar

```bash
# Instalar psql
# macOS: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql-client

# Conectar
psql -h seu-db-endpoint.rds.amazonaws.com \
     -U postgres \
     -d postgres

# Criar banco de dados
CREATE DATABASE seu_app_db;

# Criar usuário
CREATE USER seu_app_user WITH PASSWORD 'SenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE seu_app_db TO seu_app_user;
```

### 4.4 Variável de Ambiente

```bash
# Adicionar no AWS Systems Manager Parameter Store
# https://console.aws.amazon.com/systems-manager/parameters/

# Criar parâmetro:
# Name: /seu-app/database-url
# Type: SecureString
# Value: postgresql://seu_app_user:SenhaForte123!@seu-db-endpoint.rds.amazonaws.com:5432/seu_app_db
```

---

## Passo 5: Armazenamento S3

### 5.1 Criar Bucket

```bash
# 1. Ir para S3 Console
# https://console.aws.amazon.com/s3/

# 2. Clicar "Create bucket"

# 3. Nome: seu-app-assets-unique-name

# 4. Region: us-east-1

# 5. Desabilitar "Block all public access" (se necessário)

# 6. Criar bucket
```

### 5.2 Configurar CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://seu-app.amplifyapp.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 5.3 Usar no Backend

```typescript
import AWS from 'aws-sdk'

const s3 = new AWS.S3()

export async function uploadFile(file: Buffer, key: string) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: 'application/octet-stream'
  }
  
  return s3.upload(params).promise()
}
```

---

## Passo 6: CloudFront CDN

### 6.1 Criar Distribuição

```bash
# 1. Ir para CloudFront Console
# https://console.aws.amazon.com/cloudfront/

# 2. Clicar "Create distribution"

# 3. Origin domain: seu-app.amplifyapp.com

# 4. Viewer protocol policy: Redirect HTTP to HTTPS

# 5. Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE

# 6. Cache policy: Managed-CachingOptimized

# 7. Create distribution
```

### 6.2 Configurar Domínio Customizado

```bash
# 1. Ir para ACM (Certificate Manager)
# https://console.aws.amazon.com/acm/

# 2. Request certificate para seu-dominio.com

# 3. Validar via DNS

# 4. Voltar para CloudFront

# 5. Edit distribution

# 6. Alternate domain names: seu-dominio.com

# 7. SSL certificate: seu certificado

# 8. Save
```

### 6.3 Apontar DNS

```bash
# No seu registrador de domínio (GoDaddy, Namecheap, etc):

# Criar CNAME:
# Nome: seu-dominio.com
# Valor: d123456.cloudfront.net
```

---

## Passo 7: Monitoramento com CloudWatch

### 7.1 Criar Dashboard

```bash
# 1. Ir para CloudWatch
# https://console.aws.amazon.com/cloudwatch/

# 2. Clicar "Dashboards" > "Create dashboard"

# 3. Adicionar widgets:
#    - Lambda Invocations
#    - Lambda Duration
#    - Lambda Errors
#    - API Gateway Requests
#    - RDS CPU Utilization
#    - RDS Database Connections
```

### 7.2 Criar Alarmes

```bash
# Lambda Errors
# 1. CloudWatch > Alarms > Create alarm
# 2. Metric: Lambda > Errors
# 3. Threshold: > 10 errors
# 4. Action: SNS notification

# RDS CPU
# 1. Metric: RDS > CPU Utilization
# 2. Threshold: > 80%
# 3. Action: SNS notification
```

---

## Passo 8: Logs Centralizados

### 8.1 CloudWatch Logs

```typescript
// No backend Lambda
import { CloudWatchLogs } from 'aws-sdk'

const logs = new CloudWatchLogs()

export async function logEvent(message: string) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    level: 'INFO'
  }))
}
```

### 8.2 Ver Logs

```bash
# Via CLI
aws logs tail /aws/lambda/seu-app-api --follow

# Via Console
# https://console.aws.amazon.com/cloudwatch/home#logStream:
```

---

## Passo 9: Variáveis de Ambiente Seguras

### 9.1 AWS Systems Manager Parameter Store

```bash
# Criar parâmetros
aws ssm put-parameter \
  --name /seu-app/jwt-secret \
  --value "sua-chave-secreta" \
  --type SecureString

aws ssm put-parameter \
  --name /seu-app/database-url \
  --value "postgresql://..." \
  --type SecureString

aws ssm put-parameter \
  --name /seu-app/api-key \
  --value "sua-api-key" \
  --type SecureString
```

### 9.2 Usar no Lambda

```typescript
import { SSM } from 'aws-sdk'

const ssm = new SSM()

export async function getSecret(name: string) {
  const result = await ssm.getParameter({
    Name: name,
    WithDecryption: true
  }).promise()
  
  return result.Parameter?.Value
}
```

---

## Passo 10: CI/CD com GitHub Actions

### 10.1 Criar Workflow

**Arquivo `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Lambda
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npm install -g serverless
          serverless deploy --stage prod
      
      - name: Deploy to Amplify
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npm install -g @aws-amplify/cli
          amplify publish --yes
```

### 10.2 Adicionar Secrets no GitHub

```bash
# 1. Ir para Settings > Secrets and variables > Actions

# 2. Adicionar:
#    - AWS_ACCESS_KEY_ID
#    - AWS_SECRET_ACCESS_KEY
```

---

## Estimativa de Custos

| Serviço | Free Tier | Pago |
|---------|-----------|------|
| Amplify | Ilimitado | $0.01/build |
| Lambda | 1M req/mês | $0.20/1M req |
| API Gateway | 1M req/mês | $3.50/1M req |
| RDS | 750h/mês | $0.17/hora |
| S3 | 5GB | $0.023/GB |
| CloudFront | 1TB/mês | $0.085/GB |
| CloudWatch | 10 logs/mês | $0.50/GB |
| **Total** | **$0** | **$5-20/mês** |

---

## Troubleshooting

### ❌ Lambda timeout

```bash
# Aumentar timeout em serverless.yml
timeout: 60  # segundos

# Ou via console
# Lambda > Functions > seu-app-api > Configuration > General configuration
```

### ❌ RDS connection refused

```bash
# Verificar security group
# RDS > Databases > seu-app-db > Security group rules

# Adicionar regra:
# Type: PostgreSQL
# Port: 5432
# Source: 0.0.0.0/0
```

### ❌ CORS error

```typescript
// No Lambda
import cors from 'cors'

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### ❌ Amplify build fails

```bash
# Ver logs
amplify logs

# Ou via console
# Amplify > seu-app > Deployments > Build logs
```

---

## Próximos Passos

- [ ] Criar conta AWS
- [ ] Deploy frontend com Amplify
- [ ] Deploy backend com Lambda
- [ ] Criar RDS PostgreSQL
- [ ] Configurar S3
- [ ] Configurar CloudFront
- [ ] Adicionar domínio customizado
- [ ] Configurar monitoramento
- [ ] Ativar CI/CD
- [ ] Testar fluxo completo

---

## Referências

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [AWS RDS Docs](https://docs.aws.amazon.com/rds/)
- [Serverless Framework](https://www.serverless.com/)
