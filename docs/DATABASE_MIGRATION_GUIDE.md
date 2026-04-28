# Database Migration Guide

## Overview

Este guia explica o processo completo de criação e aplicação de migrações de banco de dados no projeto.

**IMPORTANTE**: Este projeto usa **Schema Dump** ao invés de migrations acumuladas. Após aplicar mudanças, você deve criar um dump do schema completo e deletar as migrations antigas.

## 📋 Checklist Pós-Migração (Workflow Correto)

Sempre que criar ou modificar o banco de dados, siga estes passos:

### ✅ 1. Criar Migration Temporária (se necessário)

```bash
# Criar migration para suas mudanças
supabase migration new add_my_feature

# Editar o arquivo SQL criado
# supabase/migrations/TIMESTAMP_add_my_feature.sql
```

### ✅ 2. Aplicar Mudanças Localmente

```bash
# Aplicar a migration no banco local
supabase db push

# OU aplicar uma migração específica
supabase migration up
```

### ✅ 3. Gerar TypeScript Types (OBRIGATÓRIO)

```bash
# Gerar types do schema local
supabase gen types typescript --local > src/types/supabase.ts

# OU do schema remoto (produção)
supabase gen types typescript --project-ref your-project-ref > src/types/supabase.ts
```

**Por que isso é importante?**
- Mantém types TypeScript sincronizados com o banco
- Previne erros de tipo em queries
- Melhora autocomplete no IDE

### ✅ 4. Testar Mudanças

```bash
# Rodar todos os testes
npm run test

# Verificar tipos TypeScript
npm run type-check

# Build para garantir que compila
npm run build
```

### ✅ 5. Criar Schema Dump Completo (CRÍTICO)

```bash
# Fazer dump do schema completo
supabase db dump --schema public --schema auth > supabase/schema.sql

# Verificar que o arquivo foi criado
cat supabase/schema.sql
```

**O que isso faz?**
- Cria um arquivo SQL único com TODO o schema atual
- Inclui todas as tabelas, indexes, RLS policies, functions, triggers
- Representa o estado completo do banco de dados
- **Substitui a necessidade de múltiplas migrations**

### ✅ 6. Deletar Migrations Antigas (OBRIGATÓRIO)

```bash
# Deletar TODAS as migrations antigas
rm supabase/migrations/*.sql

# OU mover para backup se quiser manter histórico
mkdir -p supabase/migrations_backup
mv supabase/migrations/*.sql supabase/migrations_backup/
```

**Por que deletar?**
- ✅ Evita confusão sobre qual é o estado real do banco
- ✅ O schema.sql é a fonte única de verdade
- ✅ Migrations antigas podem ter conflitos ou estar desatualizadas
- ✅ Simplifica o processo de setup para novos desenvolvedores

### ✅ 7. Commit e Versionar

```bash
# Adicionar schema dump e types
git add supabase/schema.sql
git add src/types/supabase.ts

# Remover migrations antigas do git
git rm supabase/migrations/*.sql

# Commit com mensagem descritiva
git commit -m "feat(#123): add my_feature to database schema

- Added new tables: table_a, table_b
- Updated RLS policies for table_x
- Generated TypeScript types
- Replaced migrations with schema dump"

# Incrementar versão
npm version minor  # Para novas features
npm version patch  # Para mudanças pequenas
npm version major  # Para breaking changes
```

### ✅ 8. Aplicar em Produção

```bash
# Via CLI
supabase db push --project-ref your-project-ref

# OU via Supabase Dashboard
# Settings > Database > SQL Editor
# Copiar e colar o conteúdo de supabase/schema.sql
# Executar o SQL
```

## 🚀 Scripts Automatizados

### PowerShell (Windows)

```powershell
# Aplicar localmente
.\scripts\apply-migration.ps1 local

# Aplicar em produção
.\scripts\apply-migration.ps1 remote
```

### Bash (Linux/Mac)

```bash
# Aplicar localmente
./scripts/apply-migration.sh local

# Aplicar em produção
./scripts/apply-migration.sh remote
```

## 📝 Criando Nova Migração

### 1. Criar arquivo de migração

```bash
# Supabase CLI cria automaticamente com timestamp
supabase migration new create_my_table

# Isso cria: supabase/migrations/20250427120000_create_my_table.sql
```

### 2. Escrever SQL

```sql
-- supabase/migrations/20250427120000_create_my_table.sql

-- Create table
CREATE TABLE IF NOT EXISTS public.my_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_my_table_user_id ON public.my_table(user_id);
CREATE INDEX idx_my_table_created_at ON public.my_table(created_at DESC);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own records"
    ON public.my_table
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
    ON public.my_table
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
    ON public.my_table
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
    ON public.my_table
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.my_table IS 'Stores user-specific data';
COMMENT ON COLUMN public.my_table.user_id IS 'Reference to auth.users';
```

### 3. Aplicar e testar

```bash
# Aplicar localmente
supabase db push

# Gerar types
supabase gen types typescript --local > src/types/supabase.ts

# Testar
npm run test
```

## 🔄 Rollback de Migração

### Opção 1: Criar migração reversa

```bash
# Criar nova migração que desfaz a anterior
supabase migration new rollback_my_table

# Escrever SQL reverso
DROP TABLE IF EXISTS public.my_table;
```

### Opção 2: Reset local (CUIDADO!)

```bash
# Reset completo do banco local
supabase db reset

# Isso vai:
# 1. Dropar o banco
# 2. Recriar do zero
# 3. Aplicar todas as migrações
# 4. Rodar seeds
```

### Opção 3: Restaurar backup (Produção)

```bash
# Via Supabase Dashboard
# Settings > Database > Backups > Restore
```

## 🧪 Testando Migrações

### Teste Manual

```sql
-- Conectar ao banco local
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Verificar tabela foi criada
\dt public.my_table

-- Verificar RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'my_table';

-- Verificar policies
SELECT * FROM pg_policies 
WHERE tablename = 'my_table';
```

### Teste Automatizado

```typescript
// tests/db/my-table.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('my_table migration', () => {
  it('should create table with correct schema', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Test insert
    const { data, error } = await supabase
      .from('my_table')
      .insert({ name: 'Test' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', 'Test');
  });

  it('should enforce RLS policies', async () => {
    // Test RLS is working
    // ...
  });
});
```

## 📊 Verificando Status

### Ver migrações aplicadas

```bash
# Listar todas as migrações
supabase migration list

# Ver status
supabase db status
```

### Ver schema atual

```bash
# Dump schema completo
supabase db dump --schema public > schema.sql

# Ver apenas estrutura de tabelas
supabase db dump --schema public --data-only=false
```

## ⚠️ Boas Práticas

### ✅ DO

1. **Sempre testar localmente primeiro**
   ```bash
   supabase db push  # Local
   npm run test      # Testar
   npm run build     # Garantir que compila
   ```

2. **Sempre gerar TypeScript types**
   ```bash
   # OBRIGATÓRIO após qualquer mudança no banco
   supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Sempre criar schema dump**
   ```bash
   # Após aplicar mudanças, criar dump completo
   supabase db dump --schema public --schema auth > supabase/schema.sql
   ```

4. **Sempre deletar migrations antigas**
   ```bash
   # Manter apenas o schema.sql como fonte de verdade
   rm supabase/migrations/*.sql
   ```

5. **Adicionar comentários no SQL**
   ```sql
   COMMENT ON TABLE my_table IS 'Purpose of this table';
   COMMENT ON COLUMN my_table.user_id IS 'Reference to auth.users';
   ```

6. **Criar indexes para queries frequentes**
   ```sql
   CREATE INDEX idx_user_id ON my_table(user_id);
   CREATE INDEX idx_created_at ON my_table(created_at DESC);
   ```

7. **Sempre habilitar RLS**
   ```sql
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view their own records"
     ON my_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

8. **Versionar schema.sql e types**
   ```bash
   git add supabase/schema.sql src/types/supabase.ts
   git commit -m "feat(#123): add my_table to schema"
   ```

### ❌ DON'T

1. **Nunca commitar migrations antigas**
   - Sempre delete após criar schema dump
   - O schema.sql é a fonte única de verdade

2. **Nunca commitar sem gerar types**
   ```bash
   # SEMPRE gerar types após mudanças no banco
   supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Nunca aplicar em produção sem testar localmente**
   ```bash
   # SEMPRE testar local primeiro
   supabase db push  # Local
   npm run test      # Testar
   npm run build     # Build
   # Só depois aplicar em produção
   ```

4. **Nunca manter múltiplas migrations**
   - Use schema dump único
   - Delete migrations após criar dump
   - Evita confusão e conflitos

5. **Nunca usar `CASCADE` sem entender o impacto**
   ```sql
   -- Cuidado com isso:
   DROP TABLE my_table CASCADE;  -- Pode dropar outras tabelas!
   ```

6. **Nunca fazer DROP TABLE em produção sem backup**
   - Sempre faça backup primeiro via Supabase Dashboard
   - Settings > Database > Backups

## 🔍 Troubleshooting

### Erro: "Migration already applied"

```bash
# Ver histórico de migrações
supabase migration list

# Se necessário, marcar como aplicada manualmente
# (Cuidado! Só faça se tiver certeza)
```

### Erro: "Permission denied"

```bash
# Verificar se está usando o usuário correto
# Supabase usa 'postgres' como superuser

# Conectar como superuser
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Erro: "Types out of sync"

```bash
# Regenerar types
supabase gen types typescript --local > src/types/supabase.ts

# Verificar se o arquivo foi criado
cat src/types/supabase.ts
```

### Banco local não inicia

```bash
# Parar tudo
supabase stop

# Limpar volumes
supabase db reset

# Iniciar novamente
supabase start
```

## 📚 Recursos

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Resumo Rápido

```bash
# 1. Criar migration temporária (se necessário)
supabase migration new my_feature

# 2. Escrever SQL
# Editar: supabase/migrations/TIMESTAMP_my_feature.sql

# 3. Aplicar localmente
supabase db push

# 4. Gerar types (OBRIGATÓRIO)
supabase gen types typescript --local > src/types/supabase.ts

# 5. Testar
npm run test
npm run build

# 6. Criar schema dump (CRÍTICO)
supabase db dump --schema public --schema auth > supabase/schema.sql

# 7. Deletar migrations antigas (OBRIGATÓRIO)
rm supabase/migrations/*.sql

# 8. Commit
git add supabase/schema.sql src/types/supabase.ts
git rm supabase/migrations/*.sql
git commit -m "feat(#123): add my_feature to database schema"
npm version minor

# 9. Aplicar em produção
supabase db push --project-ref your-project-ref
```

**Sempre nessa ordem! ✅**

## 🆕 Setup de Novo Desenvolvedor

Com o workflow de schema dump, um novo desenvolvedor só precisa:

```bash
# 1. Clonar o repositório
git clone repo-url

# 2. Instalar dependências
npm install

# 3. Iniciar Supabase local
supabase start

# 4. Aplicar schema completo (arquivo único)
supabase db reset

# 5. Pronto! O banco está no estado correto
```

## 💡 Filosofia: Schema Dump vs Migrations

### ❌ Problema com Migrations Acumuladas

- Dezenas de arquivos de migration
- Difícil saber o estado atual do banco
- Migrations podem conflitar ou estar fora de ordem
- Setup lento para novos desenvolvedores
- Histórico confuso e difícil de manter

### ✅ Solução: Schema Dump Único

- **Um arquivo SQL** com o estado completo do banco
- **Clareza total** sobre o schema atual
- **Setup rápido** para novos desenvolvedores
- **Menos erros** de migrations conflitantes
- **Manutenção fácil** do schema

### Como Funciona

1. Você cria uma migration temporária para suas mudanças
2. Aplica localmente e testa
3. Faz um dump do schema completo
4. **Deleta todas as migrations antigas**
5. O `schema.sql` se torna a fonte única de verdade

### Vantagens

✅ **Simplicidade**: Um arquivo ao invés de dezenas
✅ **Clareza**: Vê exatamente o estado atual do banco
✅ **Menos erros**: Não há risco de migrations conflitantes
✅ **Setup rápido**: Novos devs aplicam um arquivo só
✅ **Manutenção fácil**: Não precisa gerenciar histórico
✅ **Types sempre atualizados**: Workflow força geração de types
