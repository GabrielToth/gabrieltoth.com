#!/bin/bash

# Deploy Script - Vercel + Railway
# Uso: ./scripts/deploy.sh [frontend|backend|all]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Verificar se Vercel CLI está instalado
check_vercel() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI não está instalado"
        log_info "Instale com: npm install -g vercel"
        exit 1
    fi
}

# Verificar se Railway CLI está instalado
check_railway() {
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI não está instalado"
        log_info "Instale com: npm install -g @railway/cli"
        exit 1
    fi
}

# Deploy Frontend
deploy_frontend() {
    log_info "Iniciando deploy do frontend..."
    
    check_vercel
    
    # Build
    log_info "Buildando aplicação..."
    npm run build
    
    # Deploy
    log_info "Fazendo deploy no Vercel..."
    vercel --prod
    
    log_info "Frontend deployado com sucesso!"
}

# Deploy Backend
deploy_backend() {
    log_info "Iniciando deploy do backend..."
    
    check_railway
    
    # Verificar se está logado no Railway
    if ! railway whoami &> /dev/null; then
        log_warn "Não está logado no Railway"
        log_info "Execute: railway login"
        exit 1
    fi
    
    # Build
    log_info "Buildando backend..."
    npm run build
    
    # Deploy
    log_info "Fazendo deploy no Railway..."
    railway up
    
    log_info "Backend deployado com sucesso!"
}

# Deploy Completo
deploy_all() {
    log_info "Iniciando deploy completo..."
    
    # Verificar dependências
    check_vercel
    check_railway
    
    # Deploy backend primeiro (mais crítico)
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    log_info "Deploy completo finalizado!"
}

# Verificar argumentos
case "${1:-all}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_all
        ;;
    *)
        log_error "Uso: $0 [frontend|backend|all]"
        exit 1
        ;;
esac
