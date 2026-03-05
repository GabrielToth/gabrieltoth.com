# AWS Deployment - Resumo Executivo

## 🎯 Objetivo

Deploy de uma aplicação Next.js com backend Node.js na AWS com **custo mínimo** para baixo volume de usuários.

---

## 📊 Stack Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO FINAL                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   AWS Amplify              │
        │   - Frontend Next.js        │
        │   - CDN Global             │
        │   - Deploy automático      │
        │   - Custo: $0              │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   API Gateway + Lambda     │
        │   - REST API               │
        │   - Serverless             │
        │   - Auto-scaling           │
        │   - Custo: $0 (free tier)  │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   RDS PostgreSQL           │
        │   - Banco de dados         │
        │   - Backups automáticos    │
        │   - Custo: $0 (free tier)  │
        └────────────────────────────┘
```

---

## 💰 Custos Mensais

| Serviço | Free Tier | Pago |
|---------|-----------|------|
| **Amplify** | Ilimitado | $0 |
| **Lambda** | 1M req/mês | $0 |
| **API Gateway** | 1M req/mês | $0 |
| **RDS** | 750h/mês | $0 |
| **S3** | 5GB | $0 |
| **CloudFront** | 1TB/mês | $0 |
| **CloudWatch** | 10 logs/mês | $0 |
| **Total** | | **$0** 🎉 |

---

## 🚀 Arquivos Criados

### Documentação
- `docs/AWS_DEPLOYMENT_GUIDE.md` - Guia completo (10 passos)
- `docs/AWS_QUICK_START.md` - Deploy em 10 minutos
- `docs/AWS_COMMANDS_REFERENCE.md` - Referência de comandos
- `docs/AWS_DEPLOYMENT_CHECKLIST.md` - Checklist de deploy

### Configuração
- `serverless.yml` - Config Lambda + API Gateway
- `amplify.yml` - Config Amplify
- `.github/workflows/deploy-aws.yml` - CI/CD automático

### Código
- `src/backend/lambda.ts` - Handler Lambda
- `src/backend/health.ts` - Health check endpoint

### Scripts
- `scripts/aws-setup.sh` - Setup automático

---

## ⚡ Quick Start (10 minutos)

### 1. Criar Conta AWS
```bash
# https://aws.amazon.com
# Criar conta e adicionar cartão
```

### 2. Deploy Frontend
```bash
# Amplify Console > New app > Host web app
# Conectar GitHub > Deploy automático
```

### 3. Criar Banco de Dados
```bash
# RDS Console > Create database
# PostgreSQL > Free tier > Create
```

### 4. Deploy Backend
```bash
npm install -g serverless
serverless deploy --stage prod
```

### 5. Conectar Tudo
```bash
# Amplify > Environment variables
# NEXT_PUBLIC_API_URL = seu-api-endpoint
```

✅ **Pronto! Seu app está online!**

---

## 📋 Checklist Essencial

- [ ] Conta AWS criada
- [ ] Amplify app criado
- [ ] RDS PostgreSQL criado
- [ ] Lambda deployado
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend conectado ao backend
- [ ] Testes passando
- [ ] Monitoramento ativado

---

## 🔧 Comandos Principais

```bash
# Deploy Lambda
serverless deploy --stage prod

# Ver logs Lambda
aws logs tail /aws/lambda/seu-app-api --follow

# Conectar ao banco
psql postgresql://user:pass@endpoint:5432/dbname

# Deploy Amplify
amplify publish

# Ver status
aws sts get-caller-identity
```

---

## 📈 Escalabilidade

### Fase 1: Baixo Volume (Atual)
- Usuários: 0-100
- Requisições: 0-1000/dia
- Custo: **$0**

### Fase 2: Crescimento
- Usuários: 100-1000
- Requisições: 1000-10000/dia
- Custo: **$5-20/mês**

### Fase 3: Escala Média
- Usuários: 1000-10000
- Requisições: 10000-100000/dia
- Custo: **$50-200/mês**

### Fase 4: Escala Grande
- Usuários: 10000+
- Requisições: 100000+/dia
- Custo: **$500+/mês**

---

## 🛡️ Segurança

✅ **HTTPS/TLS** - Automático em todos os serviços
✅ **Credenciais** - Armazenadas no Parameter Store
✅ **Firewall** - Security groups configurados
✅ **Backups** - Automáticos a cada dia
✅ **Logs** - Centralizados no CloudWatch
✅ **Monitoramento** - Alertas em tempo real

---

## 📊 Monitoramento

### CloudWatch Dashboard
- Lambda invocations
- Lambda duration
- Lambda errors
- RDS CPU
- RDS connections
- API Gateway requests

### Alarmes Automáticos
- Lambda errors > 10
- Lambda timeout
- RDS CPU > 80%
- API Gateway 5XX errors

---

## 🔄 CI/CD Automático

```yaml
# GitHub Actions
1. Push para main
2. Testes executam
3. Build executa
4. Lambda deploy
5. Amplify deploy
6. Health check
7. Notificação
```

---

## 📚 Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| `AWS_DEPLOYMENT_GUIDE.md` | Guia passo a passo (10 passos) |
| `AWS_QUICK_START.md` | Deploy rápido (10 minutos) |
| `AWS_COMMANDS_REFERENCE.md` | Referência de comandos AWS |
| `AWS_DEPLOYMENT_CHECKLIST.md` | Checklist completo |

---

## 🆘 Troubleshooting

### ❌ Lambda timeout
```bash
# Aumentar timeout em serverless.yml
timeout: 60
```

### ❌ RDS connection refused
```bash
# Verificar security group
# Adicionar regra PostgreSQL porta 5432
```

### ❌ CORS error
```typescript
// Adicionar no backend
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### ❌ Amplify build fails
```bash
amplify logs
```

---

## 🎓 Próximos Passos

1. **Ler** `AWS_QUICK_START.md` (5 min)
2. **Seguir** os 10 passos do guia (30 min)
3. **Testar** tudo funcionando (10 min)
4. **Configurar** domínio customizado (5 min)
5. **Ativar** monitoramento (5 min)

**Total: ~1 hora para estar 100% online na AWS**

---

## 📞 Suporte

| Recurso | Link |
|---------|------|
| AWS Console | https://console.aws.amazon.com |
| AWS Docs | https://docs.aws.amazon.com |
| Amplify Docs | https://docs.amplify.aws |
| Lambda Docs | https://docs.aws.amazon.com/lambda |
| RDS Docs | https://docs.aws.amazon.com/rds |

---

## 🎉 Resultado Final

```
✅ Frontend online em: https://seu-app.amplifyapp.com
✅ Backend online em: https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod
✅ Banco de dados: PostgreSQL RDS
✅ Custo mensal: $0
✅ Escalabilidade: Automática
✅ Monitoramento: 24/7
✅ Backups: Automáticos
✅ CI/CD: Automático
```

🚀 **Seu app está pronto para produção na AWS!**
