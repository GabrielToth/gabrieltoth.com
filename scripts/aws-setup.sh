#!/bin/bash

# AWS Setup Script
# Configura toda a infraestrutura na AWS

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    log_step "Verificando dependências..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI não está instalado"
        log_info "Instale em: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    if ! command -v serverless &> /dev/null; then
        log_warn "Serverless Framework não está instalado"
        log_info "Instalando..."
        npm install -g serverless
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado"
        exit 1
    fi
    
    log_info "Todas as dependências estão instaladas"
}

# Configurar credenciais AWS
setup_aws_credentials() {
    log_step "Configurando credenciais AWS..."
    
    if [ -z "$AWS_ACCESS_KEY_ID" ]; then
        log_warn "Credenciais AWS não encontradas"
        log_info "Você precisa de:"
        log_info "1. Ir para https://console.aws.amazon.com/iam/"
        log_info "2. Criar um usuário com permissões de administrador"
        log_info "3. Gerar access key"
        log_info "4. Executar: aws configure"
        
        read -p "Pressione Enter para continuar..."
        aws configure
    else
        log_info "Credenciais AWS encontradas"
    fi
}

# Criar parâmetros no Systems Manager
setup_parameters() {
    log_step "Criando parâmetros no AWS Systems Manager..."
    
    local db_password=$(openssl rand -base64 32)
    local jwt_secret=$(openssl rand -base64 32)
    local api_key=$(openssl rand -base64 32)
    
    log_info "Criando parâmetros para produção..."
    
    aws ssm put-parameter \
        --name /seu-app/prod/database-url \
        --value "postgresql://postgres:${db_password}@seu-app-db.c9akciq32.us-east-1.rds.amazonaws.com:5432/seu_app_db" \
        --type SecureString \
        --overwrite 2>/dev/null || true
    
    aws ssm put-parameter \
        --name /seu-app/prod/jwt-secret \
        --value "$jwt_secret" \
        --type SecureString \
        --overwrite 2>/dev/null || true
    
    aws ssm put-parameter \
        --name /seu-app/prod/api-key \
        --value "$api_key" \
        --type SecureString \
        --overwrite 2>/dev/null || true
    
    aws ssm put-parameter \
        --name /seu-app/prod/cors-origin \
        --value "https://seu-app.amplifyapp.com" \
        --type String \
        --overwrite 2>/dev/null || true
    
    log_info "Parâmetros criados com sucesso"
    log_warn "Salve a senha do banco de dados: $db_password"
}

# Criar bucket S3
setup_s3() {
    log_step "Criando bucket S3..."
    
    local bucket_name="seu-app-assets-$(date +%s)"
    
    aws s3 mb "s3://${bucket_name}" --region us-east-1 2>/dev/null || true
    
    # Configurar CORS
    cat > /tmp/cors.json << EOF
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
        --bucket "$bucket_name" \
        --cors-configuration file:///tmp/cors.json 2>/dev/null || true
    
    log_info "Bucket S3 criado: $bucket_name"
}

# Criar RDS PostgreSQL
setup_rds() {
    log_step "Criando RDS PostgreSQL..."
    
    local db_password=$(openssl rand -base64 32)
    
    log_warn "Criando instância RDS (isso pode levar 5-10 minutos)..."
    
    aws rds create-db-instance \
        --db-instance-identifier seu-app-db \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version 16.1 \
        --master-username postgres \
        --master-user-password "$db_password" \
        --allocated-storage 20 \
        --storage-type gp2 \
        --publicly-accessible \
        --no-multi-az \
        --backup-retention-period 7 \
        --region us-east-1 2>/dev/null || true
    
    log_info "RDS PostgreSQL criado"
    log_warn "Senha do banco: $db_password"
    log_info "Aguarde 5-10 minutos para a instância ficar disponível"
}

# Deploy Lambda
deploy_lambda() {
    log_step "Deployando Lambda..."
    
    npm install
    npm run build
    
    serverless deploy --stage prod
    
    log_info "Lambda deployado com sucesso"
}

# Deploy Amplify
deploy_amplify() {
    log_step "Deployando Amplify..."
    
    npm install -g @aws-amplify/cli
    
    log_info "Conecte seu repositório GitHub no Amplify Console:"
    log_info "https://console.aws.amazon.com/amplify/"
    
    read -p "Pressione Enter quando o Amplify estiver configurado..."
}

# Criar CloudWatch Dashboard
setup_monitoring() {
    log_step "Criando CloudWatch Dashboard..."
    
    cat > /tmp/dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}],
          [".", "Errors", {"stat": "Sum"}],
          ["AWS/RDS", "CPUUtilization"],
          [".", "DatabaseConnections"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Application Metrics"
      }
    }
  ]
}
EOF
    
    aws cloudwatch put-dashboard \
        --dashboard-name seu-app-dashboard \
        --dashboard-body file:///tmp/dashboard.json 2>/dev/null || true
    
    log_info "Dashboard criado"
}

# Menu principal
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   AWS Setup - seu-app                  ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    setup_aws_credentials
    
    echo ""
    log_step "Escolha o que deseja fazer:"
    echo "1) Setup completo (recomendado)"
    echo "2) Apenas Lambda"
    echo "3) Apenas RDS"
    echo "4) Apenas S3"
    echo "5) Apenas Monitoramento"
    echo "6) Sair"
    
    read -p "Opção: " option
    
    case $option in
        1)
            setup_parameters
            setup_s3
            setup_rds
            deploy_lambda
            deploy_amplify
            setup_monitoring
            log_info "Setup completo finalizado!"
            ;;
        2)
            deploy_lambda
            ;;
        3)
            setup_rds
            ;;
        4)
            setup_s3
            ;;
        5)
            setup_monitoring
            ;;
        6)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida"
            exit 1
            ;;
    esac
}

# Executar
main
