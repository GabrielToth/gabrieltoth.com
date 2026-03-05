# AWS Commands Reference

## Configuração Inicial

### Instalar AWS CLI

```bash
# macOS
brew install awscli

# Windows
choco install awscliv2

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configurar Credenciais

```bash
aws configure

# Ou via variáveis de ambiente
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

---

## Lambda

### Deploy

```bash
# Instalar Serverless Framework
npm install -g serverless

# Deploy para produção
serverless deploy --stage prod

# Deploy apenas função específica
serverless deploy function -f api --stage prod

# Remover stack
serverless remove --stage prod
```

### Logs

```bash
# Ver logs em tempo real
aws logs tail /aws/lambda/seu-app-api --follow

# Ver logs de um período específico
aws logs filter-log-events \
  --log-group-name /aws/lambda/seu-app-api \
  --start-time $(date -d '1 hour ago' +%s)000

# Exportar logs
aws logs create-export-task \
  --log-group-name /aws/lambda/seu-app-api \
  --from $(date -d '1 day ago' +%s)000 \
  --to $(date +%s)000 \
  --destination seu-app-logs \
  --destination-prefix logs
```

### Monitoramento

```bash
# Ver métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=seu-app-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Criar alarme
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Variáveis de Ambiente

```bash
# Atualizar variável de ambiente
aws lambda update-function-configuration \
  --function-name seu-app-api \
  --environment Variables={DATABASE_URL=postgresql://...}

# Ver configuração
aws lambda get-function-configuration \
  --function-name seu-app-api
```

---

## RDS PostgreSQL

### Criar Instância

```bash
aws rds create-db-instance \
  --db-instance-identifier seu-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password SenhaForte123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --publicly-accessible \
  --backup-retention-period 7
```

### Conectar

```bash
# Instalar psql
# macOS: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql-client

# Conectar
psql -h seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d seu_app_db

# Ou via URL
psql postgresql://postgres:password@seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com:5432/seu_app_db
```

### Backup e Restore

```bash
# Criar snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier seu-app-db \
  --db-snapshot-identifier seu-app-db-backup-$(date +%Y%m%d)

# Listar snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier seu-app-db

# Restaurar de snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier seu-app-db-restored \
  --db-snapshot-identifier seu-app-db-backup-20240101
```

### Monitoramento

```bash
# Ver métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=seu-app-db \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average

# Ver conexões
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=seu-app-db \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

---

## S3

### Criar Bucket

```bash
aws s3 mb s3://seu-app-assets-unique-name --region us-east-1
```

### Upload

```bash
# Upload arquivo único
aws s3 cp file.txt s3://seu-app-assets/

# Upload diretório
aws s3 cp ./dist s3://seu-app-assets/ --recursive

# Upload com metadados
aws s3 cp file.txt s3://seu-app-assets/ \
  --metadata "author=seu-nome,date=$(date)"
```

### Download

```bash
# Download arquivo
aws s3 cp s3://seu-app-assets/file.txt ./

# Download diretório
aws s3 cp s3://seu-app-assets/ ./dist --recursive
```

### Listar

```bash
# Listar bucket
aws s3 ls s3://seu-app-assets/

# Listar com tamanho
aws s3 ls s3://seu-app-assets/ --recursive --summarize

# Listar com filtro
aws s3 ls s3://seu-app-assets/ --recursive --query 'Contents[?Size > `1000000`]'
```

### Configurar CORS

```bash
cat > cors.json << 'EOF'
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://seu-app.amplifyapp.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
EOF

aws s3api put-bucket-cors \
  --bucket seu-app-assets \
  --cors-configuration file://cors.json
```

---

## API Gateway

### Listar APIs

```bash
aws apigateway get-rest-apis
```

### Ver Endpoints

```bash
aws apigateway get-resources \
  --rest-api-id seu-api-id
```

### Criar Alarme

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name api-errors \
  --alarm-description "Alert on API errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## CloudWatch

### Criar Dashboard

```bash
cat > dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations"],
          [".", "Duration"],
          [".", "Errors"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Metrics"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name seu-app-dashboard \
  --dashboard-body file://dashboard.json
```

### Ver Logs

```bash
# Listar log groups
aws logs describe-log-groups

# Ver logs
aws logs tail /aws/lambda/seu-app-api --follow

# Filtrar logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/seu-app-api \
  --filter-pattern "ERROR"
```

---

## Systems Manager Parameter Store

### Criar Parâmetro

```bash
# String simples
aws ssm put-parameter \
  --name /seu-app/api-key \
  --value "sua-chave-api" \
  --type String

# String criptografada
aws ssm put-parameter \
  --name /seu-app/database-url \
  --value "postgresql://..." \
  --type SecureString

# Lista
aws ssm put-parameter \
  --name /seu-app/allowed-origins \
  --value "https://seu-app.amplifyapp.com,https://seu-dominio.com" \
  --type StringList
```

### Recuperar Parâmetro

```bash
# Recuperar valor
aws ssm get-parameter \
  --name /seu-app/api-key \
  --query 'Parameter.Value' \
  --output text

# Recuperar com descriptografia
aws ssm get-parameter \
  --name /seu-app/database-url \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text

# Listar todos os parâmetros
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Values=/seu-app"
```

### Atualizar Parâmetro

```bash
aws ssm put-parameter \
  --name /seu-app/api-key \
  --value "nova-chave-api" \
  --overwrite
```

---

## IAM

### Criar Usuário

```bash
aws iam create-user --user-name seu-app-deploy

# Adicionar permissões
aws iam attach-user-policy \
  --user-name seu-app-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### Criar Access Key

```bash
aws iam create-access-key --user-name seu-app-deploy
```

### Listar Usuários

```bash
aws iam list-users
```

---

## Amplify

### Deploy

```bash
npm install -g @aws-amplify/cli

# Inicializar
amplify init

# Publicar
amplify publish

# Publicar sem confirmação
amplify publish --yes
```

### Ver Status

```bash
amplify status
```

### Logs

```bash
amplify logs
```

---

## Billing

### Ver Custos

```bash
# Custos do mês atual
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE

# Custos por serviço
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Alertas de Orçamento

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## Troubleshooting

### Verificar Credenciais

```bash
aws sts get-caller-identity
```

### Verificar Permissões

```bash
aws iam get-user
```

### Ver Erros Recentes

```bash
aws cloudtrail lookup-events \
  --max-results 10 \
  --query 'Events[*].[EventTime,EventName,ErrorCode]'
```

---

## Dicas Úteis

### Alias para Comandos Frequentes

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
alias aws-logs='aws logs tail /aws/lambda/seu-app-api --follow'
alias aws-deploy='serverless deploy --stage prod'
alias aws-status='aws sts get-caller-identity'
```

### Exportar Variáveis de Ambiente

```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=seu-app
export AWS_PAGER=""  # Desabilitar pager
```

### Usar Profiles

```bash
# Criar profile
aws configure --profile seu-app

# Usar profile
aws s3 ls --profile seu-app

# Ou via variável
export AWS_PROFILE=seu-app
```
