#!/bin/bash

# Script para aplicar mudanças de banco de dados
# Uso: ./scripts/apply-migration.sh [local|remote]
# 
# Este script segue o workflow de Schema Dump:
# 1. Aplica migrations temporárias
# 2. Gera TypeScript types
# 3. Cria schema dump completo
# 4. Deleta migrations antigas

set -e  # Exit on error

ENV=${1:-local}

echo "🚀 Applying database changes ($ENV)..."

if [ "$ENV" = "local" ]; then
    echo "📦 Step 1: Applying migrations to local database..."
    supabase db push
    
    echo "🔧 Step 2: Generating TypeScript types from local database..."
    supabase gen types typescript --local > src/types/supabase.ts
    
    echo "📸 Step 3: Creating schema dump..."
    supabase db dump --schema public --schema auth > supabase/schema.sql
    
    echo "🗑️  Step 4: Cleaning up old migrations..."
    MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
    
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo "   Found $MIGRATION_COUNT migration file(s)"
        
        # Create backup directory
        BACKUP_DIR="supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Move migrations to backup
        mv supabase/migrations/*.sql "$BACKUP_DIR/" 2>/dev/null || true
        echo "   Moved migrations to: $BACKUP_DIR"
    else
        echo "   No migration files to clean up"
    fi
    
elif [ "$ENV" = "remote" ]; then
    echo "⚠️  WARNING: This will apply changes to PRODUCTION!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Aborted"
        exit 1
    fi
    
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        echo "❌ SUPABASE_PROJECT_REF environment variable not set"
        exit 1
    fi
    
    echo "📦 Step 1: Applying migrations to remote database..."
    supabase db push --project-ref "$SUPABASE_PROJECT_REF"
    
    echo "🔧 Step 2: Generating TypeScript types from remote database..."
    supabase gen types typescript --project-ref "$SUPABASE_PROJECT_REF" > src/types/supabase.ts
    
    echo "📸 Step 3: Creating schema dump from remote..."
    supabase db dump --project-ref "$SUPABASE_PROJECT_REF" --schema public --schema auth > supabase/schema.sql
    
    echo "🗑️  Step 4: Cleaning up old migrations..."
    MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
    
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo "   Found $MIGRATION_COUNT migration file(s)"
        
        # Create backup directory
        BACKUP_DIR="supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Move migrations to backup
        mv supabase/migrations/*.sql "$BACKUP_DIR/" 2>/dev/null || true
        echo "   Moved migrations to: $BACKUP_DIR"
    else
        echo "   No migration files to clean up"
    fi
    
else
    echo "❌ Invalid environment. Use 'local' or 'remote'"
    exit 1
fi

echo ""
echo "✅ Database changes applied successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Review generated types: src/types/supabase.ts"
echo "2. Review schema dump: supabase/schema.sql"
echo "3. Run tests: npm run test"
echo "4. Run build: npm run build"
echo "5. Commit changes:"
echo "   git add supabase/schema.sql src/types/supabase.ts"
echo "   git rm supabase/migrations/*.sql (if any)"
echo "   git commit -m 'feat(#123): update database schema'"
echo "6. Update version: npm version minor"
echo ""
echo "💡 Tip: Old migrations backed up in supabase/migrations_backup_*"
