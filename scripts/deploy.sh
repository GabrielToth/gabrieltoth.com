#!/bin/bash

# Deploy Script - Vercel
# Uso: ./scripts/deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_vercel() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed"
        log_info "Install with: npm install -g vercel"
        exit 1
    fi
}

log_info "Starting frontend deployment..."

check_vercel

log_info "Building application..."
npm run build

log_info "Deploying to Vercel..."
vercel --prod

log_info "Frontend deployed successfully!"
