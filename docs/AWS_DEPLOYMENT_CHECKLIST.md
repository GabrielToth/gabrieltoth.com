# AWS Deployment Checklist

## Pré-Deploy

### Conta AWS
- [ ] Conta AWS criada
- [ ] Cartão de crédito adicionado
- [ ] Free tier verificado
- [ ] Billing alerts configurados
- [ ] IAM user criado para deploy

### Credenciais
- [ ] AWS CLI instalado
- [ ] Credenciais configuradas (`aws configure`)
- [ ] Credenciais testadas (`aws sts get-caller-identity`)
- [ ] Access keys salvas em local seguro

### Código
- [ ] Código commitado no GitHub
- [ ] Branch main atualizado
- [ ] Testes passando (`npm run test:run`)
- [ ] Linter passando (`npm run lint`)
- [ ] Build local funcionando (`npm run build`)

---

## Deploy Backend (Lambda)

### Preparação
- [ ] `serverless.yml` configurado
- [ ] `src/backend/lambda.ts` criado
- [ ] `src/backend/health.ts` criado
- [ ] Dependências instaladas (`npm ci`)
- [ ] Build executado (`npm run build`)

### Deployment
- [ ] Serverless Framework instalado (`npm install -g serverless`)
- [ ] Credenciais AWS configuradas
- [ ] Deploy executado (`serverless deploy --stage prod`)
- [ ] API endpoint anotado
- [ ] Health check testado

### Pós-Deploy
- [ ] Lambda function criada
- [ ] API Gateway criado
- [ ] Logs verificados
- [ ] Métricas visíveis no CloudWatch
- [ ] Alarmes configurados

---

## Deploy Frontend (Amplify)

### Preparação
- [ ] `amplify.yml` configurado
- [ ] Variáveis de ambiente definidas
- [ ] Build local funcionando
- [ ] Repositório GitHub conectado

### Deployment
- [ ] Amplify app criado
- [ ] GitHub autorizado
- [ ] Branch main selecionado
- [ ] Build settings verificados
- [ ] Deploy automático ativado

### Pós-Deploy
- [ ] Frontend online
- [ ] URL Amplify anotada
- [ ] Build logs verificados
- [ ] Página carrega corretamente
- [ ] Console sem erros

---

## Banco de Dados (RDS)

### Criação
- [ ] RDS PostgreSQL criado
- [ ] Instância: db.t3.micro
- [ ] Storage: 20GB
- [ ] Multi-AZ: Desativado
- [ ] Backup retention: 7 dias

### Configuração
- [ ] Security group criado
- [ ] Inbound rule: PostgreSQL porta 5432
- [ ] Master username: postgres
- [ ] Master password salva
- [ ] Endpoint anotado

### Conexão
- [ ] psql instalado
- [ ] Conexão testada
- [ ] Banco de dados criado
- [ ] Usuário criado
- [ ] Permissões concedidas

### Migrations
- [ ] Schema criado
- [ ] Tabelas criadas
- [ ] Índices criados
- [ ] Constraints adicionados
- [ ] Dados de teste inseridos

---

## Armazenamento (S3)

### Bucket
- [ ] Bucket S3 criado
- [ ] Nome único
- [ ] Região: us-east-1
- [ ] Versionamento: Ativado
- [ ] Encryption: Ativado

### Configuração
- [ ] CORS configurado
- [ ] Bucket policy configurada
- [ ] Public access bloqueado
- [ ] Lifecycle rules configuradas
- [ ] Logging ativado

### Testes
- [ ] Upload testado
- [ ] Download testado
- [ ] CORS testado
- [ ] Permissões verificadas

---

## Variáveis de Ambiente

### Systems Manager Parameter Store
- [ ] `/seu-app/prod/database-url` criado
- [ ] `/seu-app/prod/jwt-secret` criado
- [ ] `/seu-app/prod/api-key` criado
- [ ] `/seu-app/prod/cors-origin` criado
- [ ] Todos criptografados (SecureString)

### Amplify
- [ ] `NEXT_PUBLIC_API_URL` configurado
- [ ] `NEXT_PUBLIC_REGION` configurado
- [ ] Variáveis sincronizadas com Lambda

### Lambda
- [ ] Environment variables configuradas
- [ ] IAM role com permissões SSM
- [ ] Variáveis testadas

---

## Segurança

### HTTPS/TLS
- [ ] Amplify: HTTPS automático
- [ ] API Gateway: HTTPS automático
- [ ] RDS: SSL/TLS ativado
- [ ] Certificados válidos

### Credenciais
- [ ] Nenhuma credencial no código
- [ ] Nenhuma credencial em logs
- [ ] Secrets no Parameter Store
- [ ] Access keys rotacionadas

### Firewall
- [ ] Security groups configurados
- [ ] RDS: Acesso restrito
- [ ] S3: Public access bloqueado
- [ ] WAF: Considerado para API

### Headers de Segurança
- [ ] X-Content-Type-Options
- [ ] X-Frame-Options
- [ ] X-XSS-Protection
- [ ] Strict-Transport-Security
- [ ] Content-Security-Policy

---

## Monitoramento

### CloudWatch
- [ ] Dashboard criado
- [ ] Métricas Lambda visíveis
- [ ] Métricas RDS visíveis
- [ ] Métricas API Gateway visíveis

### Alarmes
- [ ] Lambda errors > 10
- [ ] Lambda duration > 25s
- [ ] RDS CPU > 80%
- [ ] RDS connections > 100
- [ ] API Gateway 5XX > 5

### Logs
- [ ] CloudWatch Logs configurado
- [ ] Log retention: 7 dias
- [ ] Log groups criados
- [ ] Logs testados

### Notificações
- [ ] SNS topic criado
- [ ] Email subscrito
- [ ] Alarmes conectados ao SNS

---

## CI/CD

### GitHub Actions
- [ ] `.github/workflows/deploy-aws.yml` criado
- [ ] Secrets configurados:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `AWS_API_ID`
  - [ ] `AMPLIFY_APP_ID`
- [ ] Workflow testado
- [ ] Deploy automático funcionando

### Rollback
- [ ] Plano de rollback definido
- [ ] Snapshots RDS criados
- [ ] Versões Lambda testadas
- [ ] Procedimento documentado

---

## Testes

### Frontend
- [ ] Página carrega
- [ ] Tema funciona
- [ ] Idiomas funcionam
- [ ] Links funcionam
- [ ] Formulários funcionam
- [ ] API calls funcionam

### Backend
- [ ] Health check retorna 200
- [ ] Endpoints respondem
- [ ] Banco de dados conecta
- [ ] Autenticação funciona
- [ ] Rate limiting funciona
- [ ] Erros são tratados

### Integração
- [ ] Frontend conecta ao backend
- [ ] Dados são salvos no banco
- [ ] Uploads S3 funcionam
- [ ] Fluxo completo funciona

---

## Performance

### Frontend
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

### Backend
- [ ] Lambda cold start < 5s
- [ ] Warm start < 100ms
- [ ] P99 latency < 1s
- [ ] Throughput > 100 req/s

### Banco de Dados
- [ ] Query time < 100ms
- [ ] Connection pool otimizado
- [ ] Índices criados
- [ ] Slow queries monitoradas

---

## Backup & Disaster Recovery

### RDS
- [ ] Backups automáticos: 7 dias
- [ ] Snapshot manual criado
- [ ] Restore testado
- [ ] Point-in-time recovery testado

### S3
- [ ] Versionamento ativado
- [ ] Lifecycle rules configuradas
- [ ] Replicação considerada
- [ ] Restore testado

### Código
- [ ] GitHub backup
- [ ] Tags de release criadas
- [ ] Histórico preservado

---

## Documentação

### Runbooks
- [ ] Deploy procedure documentado
- [ ] Rollback procedure documentado
- [ ] Troubleshooting guide criado
- [ ] Escalation contacts listados

### Arquitetura
- [ ] Diagrama criado
- [ ] Componentes documentados
- [ ] Fluxos de dados documentados
- [ ] Decisões arquiteturais registradas

### Operações
- [ ] Monitoring guide criado
- [ ] Alerting guide criado
- [ ] Scaling guide criado
- [ ] Maintenance schedule definido

---

## Custos

### Estimativa
- [ ] Custos estimados calculados
- [ ] Free tier limits verificados
- [ ] Alertas de orçamento configurados
- [ ] Plano de escalabilidade definido

### Otimização
- [ ] Lambda memory otimizado
- [ ] RDS instance type otimizado
- [ ] S3 storage classes considerados
- [ ] CloudFront cache otimizado

---

## Pós-Deploy

### Validação
- [ ] Tudo funcionando em produção
- [ ] Logs sem erros
- [ ] Métricas normais
- [ ] Usuários conseguem acessar

### Comunicação
- [ ] Time notificado
- [ ] Stakeholders informados
- [ ] Documentação atualizada
- [ ] Postmortem agendado (se necessário)

### Monitoramento
- [ ] Alertas ativados
- [ ] Dashboard monitorado
- [ ] Logs verificados regularmente
- [ ] Performance monitorada

---

## Próximas Etapas

- [ ] Domínio customizado configurado
- [ ] CloudFront CDN ativado
- [ ] WAF configurado
- [ ] Backup strategy refinada
- [ ] Disaster recovery testada
- [ ] Scaling policy definida
- [ ] Cost optimization revisada

---

## Contatos de Emergência

| Serviço | Contato | Docs |
|---------|---------|------|
| AWS Support | support@aws.amazon.com | aws.amazon.com/support |
| Lambda | - | docs.aws.amazon.com/lambda |
| RDS | - | docs.aws.amazon.com/rds |
| Amplify | - | docs.amplify.aws |

---

## Notas

```
Data do Deploy: _______________
Versão: _______________
Responsável: _______________
Observações: _______________
```
