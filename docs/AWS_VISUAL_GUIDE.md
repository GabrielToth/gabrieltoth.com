# AWS Deployment - Guia Visual

## 🎯 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  SEU APP NA AWS                                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ USUÁRIO ACESSA: https://seu-app.amplifyapp.com      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AWS AMPLIFY (Frontend)                               │   │
│  │ ├─ Next.js App                                       │   │
│  │ ├─ CDN Global                                        │   │
│  │ ├─ Deploy Automático                                │   │
│  │ └─ Custo: $0                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API GATEWAY + LAMBDA (Backend)                       │   │
│  │ ├─ REST API                                          │   │
│  │ ├─ Node.js 20                                        │   │
│  │ ├─ Auto-scaling                                      │   │
│  │ └─ Custo: $0 (1M req/mês)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ RDS POSTGRESQL (Database)                            │   │
│  │ ├─ PostgreSQL 16                                     │   │
│  │ ├─ 20GB Storage                                      │   │
│  │ ├─ Backups Automáticos                              │   │
│  │ └─ Custo: $0 (750h/mês)                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Passo 1: Criar Conta AWS

```
1. Ir para: https://aws.amazon.com
   
2. Clicar em "Create an AWS Account"
   
3. Preencher dados:
   ├─ Email
   ├─ Senha
   ├─ Nome da conta
   └─ Informações de contato
   
4. Adicionar cartão de crédito
   (Não será cobrado no free tier)
   
5. Verificar email
   
6. Fazer login no console
   
✅ Conta criada!
```

---

## 📋 Passo 2: Deploy Frontend com Amplify

```
1. Ir para: https://console.aws.amazon.com/amplify/

2. Clicar em "New app" > "Host web app"

3. Selecionar GitHub
   ├─ Clicar "GitHub"
   ├─ Autorizar AWS Amplify
   └─ Selecionar repositório

4. Configurar build
   ├─ Branch: main
   ├─ Build command: npm run build
   └─ Output directory: .next

5. Adicionar variáveis de ambiente
   ├─ NEXT_PUBLIC_API_URL = (será preenchido depois)
   └─ NEXT_PUBLIC_REGION = us-east-1

6. Clicar "Save and deploy"

⏳ Aguardar 2-3 minutos

✅ Frontend online em: https://seu-app.amplifyapp.com
```

---

## 📋 Passo 3: Criar Banco de Dados RDS

```
1. Ir para: https://console.aws.amazon.com/rds/

2. Clicar em "Create database"

3. Selecionar PostgreSQL
   ├─ Engine: PostgreSQL
   ├─ Version: 16.1
   └─ Templates: Free tier

4. Configurar instância
   ├─ DB instance identifier: seu-app-db
   ├─ Master username: postgres
   ├─ Master password: SenhaForte123!
   ├─ DB instance class: db.t3.micro
   ├─ Storage: 20 GB
   ├─ Multi-AZ: No
   └─ Backup retention: 7 days

5. Clicar "Create database"

⏳ Aguardar 5-10 minutos

✅ Banco criado!
   Endpoint: seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com
```

---

## 📋 Passo 4: Configurar Security Group RDS

```
1. Ir para: RDS > Databases > seu-app-db

2. Clicar em "Security group rules"

3. Clicar em "Inbound rules"

4. Clicar "Edit inbound rules"

5. Adicionar regra:
   ├─ Type: PostgreSQL
   ├─ Port: 5432
   ├─ Source: 0.0.0.0/0 (ou seu IP)
   └─ Description: Allow PostgreSQL

6. Clicar "Save"

✅ Security group configurado!
```

---

## 📋 Passo 5: Conectar ao Banco de Dados

```
1. Instalar psql
   macOS:   brew install postgresql
   Windows: https://www.postgresql.org/download/windows/
   Linux:   sudo apt-get install postgresql-client

2. Conectar ao banco
   psql -h seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com \
        -U postgres \
        -d postgres

3. Criar banco de dados
   CREATE DATABASE seu_app_db;

4. Criar usuário
   CREATE USER seu_app_user WITH PASSWORD 'SenhaForte123!';

5. Conceder permissões
   GRANT ALL PRIVILEGES ON DATABASE seu_app_db TO seu_app_user;

6. Sair
   \q

✅ Banco de dados configurado!
```

---

## 📋 Passo 6: Criar Parâmetros no Systems Manager

```
1. Ir para: https://console.aws.amazon.com/systems-manager/

2. Clicar em "Parameter Store"

3. Clicar "Create parameter"

4. Criar parâmetro 1: DATABASE_URL
   ├─ Name: /seu-app/prod/database-url
   ├─ Type: SecureString
   ├─ Value: postgresql://seu_app_user:SenhaForte123!@seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com:5432/seu_app_db
   └─ Create

5. Criar parâmetro 2: JWT_SECRET
   ├─ Name: /seu-app/prod/jwt-secret
   ├─ Type: SecureString
   ├─ Value: (gerar com: openssl rand -base64 32)
   └─ Create

6. Criar parâmetro 3: CORS_ORIGIN
   ├─ Name: /seu-app/prod/cors-origin
   ├─ Type: String
   ├─ Value: https://seu-app.amplifyapp.com
   └─ Create

✅ Parâmetros criados!
```

---

## 📋 Passo 7: Deploy Backend com Lambda

```
1. Instalar Serverless Framework
   npm install -g serverless

2. Configurar credenciais AWS
   serverless config credentials --provider aws \
     --key YOUR_ACCESS_KEY_ID \
     --secret YOUR_SECRET_ACCESS_KEY

3. Fazer deploy
   serverless deploy --stage prod

4. Copiar endpoint
   endpoint: https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod

✅ Backend online!
```

---

## 📋 Passo 8: Conectar Frontend ao Backend

```
1. Ir para: https://console.aws.amazon.com/amplify/

2. Selecionar seu app

3. Clicar em "Environment variables"

4. Adicionar variável
   ├─ Key: NEXT_PUBLIC_API_URL
   ├─ Value: https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
   └─ Save

5. Amplify faz redeploy automático

⏳ Aguardar 2-3 minutos

✅ Frontend e backend conectados!
```

---

## 📋 Passo 9: Testar Tudo

```
1. Testar Frontend
   curl https://seu-app.amplifyapp.com
   
   Resultado esperado: HTML da página

2. Testar Backend
   curl https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod/health
   
   Resultado esperado: {"status":"healthy",...}

3. Testar no Navegador
   ├─ Abrir: https://seu-app.amplifyapp.com
   ├─ Abrir DevTools (F12)
   ├─ Ir para Console
   ├─ Verificar se há erros
   └─ Testar funcionalidades

✅ Tudo funcionando!
```

---

## 📋 Passo 10: Configurar Monitoramento

```
1. Ir para: https://console.aws.amazon.com/cloudwatch/

2. Clicar em "Dashboards"

3. Clicar "Create dashboard"

4. Adicionar widgets
   ├─ Lambda Invocations
   ├─ Lambda Duration
   ├─ Lambda Errors
   ├─ RDS CPU Utilization
   └─ RDS Database Connections

5. Clicar "Create alarm"
   ├─ Metric: Lambda Errors
   ├─ Threshold: > 10
   ├─ Action: SNS notification
   └─ Create

✅ Monitoramento ativado!
```

---

## 🎯 Resultado Final

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ✅ TUDO PRONTO!                                         │
│                                                           │
│  Frontend:  https://seu-app.amplifyapp.com              │
│  Backend:   https://seu-api-id.execute-api.us-east-1... │
│  Database:  PostgreSQL RDS                              │
│  Custo:     $0/mês                                       │
│                                                           │
│  Próximas etapas:                                        │
│  ├─ Configurar domínio customizado                      │
│  ├─ Ativar CloudFront CDN                               │
│  ├─ Configurar backups                                  │
│  └─ Ativar CI/CD automático                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting Rápido

### ❌ "Cannot find module"
```bash
npm ci
npm run build
serverless deploy --stage prod
```

### ❌ "Connection refused"
```bash
# Verificar security group do RDS
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
timeout: 60
```

---

## 📊 Custos Estimados

```
┌─────────────────────────────────────────┐
│  SERVIÇO          │  FREE TIER  │ PAGO  │
├─────────────────────────────────────────┤
│  Amplify          │  Ilimitado  │  $0   │
│  Lambda           │  1M req/mês │  $0   │
│  API Gateway      │  1M req/mês │  $0   │
│  RDS              │  750h/mês   │  $0   │
│  S3               │  5GB        │  $0   │
│  CloudFront       │  1TB/mês    │  $0   │
│  CloudWatch       │  10 logs    │  $0   │
├─────────────────────────────────────────┤
│  TOTAL            │             │  $0   │
└─────────────────────────────────────────┘
```

---

## 🎓 Próximas Etapas

1. ✅ Conta AWS criada
2. ✅ Frontend deployado
3. ✅ Banco de dados criado
4. ✅ Backend deployado
5. ✅ Tudo conectado
6. ⏭️ Domínio customizado
7. ⏭️ CloudFront CDN
8. ⏭️ CI/CD automático

---

## 📞 Referências

- [AWS Console](https://console.aws.amazon.com/)
- [Amplify Docs](https://docs.amplify.aws/)
- [Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [RDS Docs](https://docs.aws.amazon.com/rds/)
- [Serverless Framework](https://www.serverless.com/)

🚀 **Seu app está online na AWS!**
