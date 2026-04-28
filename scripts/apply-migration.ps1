# Script PowerShell para aplicar mudanças de banco de dados
# Uso: .\scripts\apply-migration.ps1 [local|remote]
# 
# Este script segue o workflow de Schema Dump:
# 1. Aplica migrations temporárias
# 2. Gera TypeScript types
# 3. Cria schema dump completo
# 4. Deleta migrations antigas

param(
    [Parameter(Position=0)]
    [ValidateSet('local', 'remote')]
    [string]$Environment = 'local'
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Applying database changes ($Environment)..." -ForegroundColor Cyan

if ($Environment -eq 'local') {
    Write-Host "📦 Step 1: Applying migrations to local database..." -ForegroundColor Yellow
    npx supabase db push
    
    Write-Host "🔧 Step 2: Generating TypeScript types from local database..." -ForegroundColor Yellow
    npx supabase gen types typescript --local | Out-File -FilePath "src/types/supabase.ts" -Encoding utf8
    
    Write-Host "📸 Step 3: Creating schema dump..." -ForegroundColor Yellow
    npx supabase db dump --schema public --schema auth | Out-File -FilePath "supabase/schema.sql" -Encoding utf8
    
    Write-Host "🗑️  Step 4: Cleaning up old migrations..." -ForegroundColor Yellow
    $migrationCount = (Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" -ErrorAction SilentlyContinue).Count
    
    if ($migrationCount -gt 0) {
        Write-Host "   Found $migrationCount migration file(s)" -ForegroundColor Gray
        
        # Create backup directory
        $backupDir = "supabase/migrations_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Move migrations to backup
        Move-Item -Path "supabase/migrations/*.sql" -Destination $backupDir -Force
        Write-Host "   Moved migrations to: $backupDir" -ForegroundColor Gray
    } else {
        Write-Host "   No migration files to clean up" -ForegroundColor Gray
    }
    
} elseif ($Environment -eq 'remote') {
    Write-Host "⚠️  WARNING: This will apply changes to PRODUCTION!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -ne 'yes') {
        Write-Host "❌ Aborted" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📦 Step 1: Applying migrations to remote database..." -ForegroundColor Yellow
    npx supabase db push --project-ref $env:SUPABASE_PROJECT_REF
    
    Write-Host "🔧 Step 2: Generating TypeScript types from remote database..." -ForegroundColor Yellow
    npx supabase gen types typescript --project-ref $env:SUPABASE_PROJECT_REF | Out-File -FilePath "src/types/supabase.ts" -Encoding utf8
    
    Write-Host "📸 Step 3: Creating schema dump from remote..." -ForegroundColor Yellow
    npx supabase db dump --project-ref $env:SUPABASE_PROJECT_REF --schema public --schema auth | Out-File -FilePath "supabase/schema.sql" -Encoding utf8
    
    Write-Host "🗑️  Step 4: Cleaning up old migrations..." -ForegroundColor Yellow
    $migrationCount = (Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" -ErrorAction SilentlyContinue).Count
    
    if ($migrationCount -gt 0) {
        Write-Host "   Found $migrationCount migration file(s)" -ForegroundColor Gray
        
        # Create backup directory
        $backupDir = "supabase/migrations_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Move migrations to backup
        Move-Item -Path "supabase/migrations/*.sql" -Destination $backupDir -Force
        Write-Host "   Moved migrations to: $backupDir" -ForegroundColor Gray
    } else {
        Write-Host "   No migration files to clean up" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Database changes applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review generated types: src/types/supabase.ts"
Write-Host "2. Review schema dump: supabase/schema.sql"
Write-Host "3. Run tests: npm run test"
Write-Host "4. Run build: npm run build"
Write-Host "5. Commit changes:"
Write-Host "   git add supabase/schema.sql src/types/supabase.ts"
Write-Host "   git rm supabase/migrations/*.sql (if any)"
Write-Host "   git commit -m 'feat(#123): update database schema'"
Write-Host "6. Update version: npm version minor"
Write-Host ""
Write-Host "💡 Tip: Old migrations backed up in supabase/migrations_backup_*" -ForegroundColor Gray

