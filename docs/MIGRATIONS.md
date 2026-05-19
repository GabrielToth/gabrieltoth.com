# Migrações Supabase

1. Crie a migração em `supabase/migrations/` (timestamp + descrição).
2. Aplique no projeto remoto: `npx supabase db push` (ou SQL Editor).
3. Atualize o schema/types local se o projeto usar geração de tipos.
4. **Remova o arquivo `.sql` da pasta `migrations/`** após aplicar — o histórico fica no Supabase; o repo mantém só o schema atual, não um arquivo por alteração antiga.

Não adicione testes Vitest só para arquivos de migração.
