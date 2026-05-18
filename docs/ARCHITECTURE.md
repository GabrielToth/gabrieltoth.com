# Arquitetura — gabrieltoth.com

## Stack (produção)

| Camada | Serviço | Plano |
|--------|---------|--------|
| Frontend + API Routes | [Vercel](https://vercel.com) | Hobby |
| DNS / CDN / WAF | [Cloudflare](https://cloudflare.com) | Free |
| Banco + Auth | [Supabase](https://supabase.com) | Free |
| E-mail transacional | [Resend](https://resend.com) | Free |
| OAuth | Google Cloud Console | — |

Não usamos AWS, GCP, Azure, Lambda, ElastiCache nem SMTP próprio.

## Repositório

```
src/app/          → Next.js App Router (páginas + API routes)
src/lib/          → Lógica compartilhada (auth, db, youtube, config)
src/components/   → UI React
docker/           → Postgres + Redis locais (dev/testes)
scripts/          → Utilitários (cleanup Supabase, secrets)
docs/             → Documentação humana (este arquivo + DEPLOYMENT.md)
```

## Ambientes

| Ambiente | Arquivo local | Onde configurar na nuvem |
|----------|---------------|---------------------------|
| Desenvolvimento | `.env.local` (copiar de `.env.local.example`) | — |
| Testes Vitest | `.env.test` / `.env.test.local` | — |
| Espelho produção | `.env.production` (não commitar) | **Vercel → Settings → Environment Variables** |
| Docker local | `.env.docker` (opcional) | — |

O Next.js **não** carrega `.env.production` no `npm run dev`. Na Vercel, as variáveis vêm do painel, não do arquivo no disco.

## Senhas

- **Somente Argon2id** (`src/lib/auth/password-security/argon2id-hasher.ts`)
- Bcrypt e migração foram removidos; contas antigas devem ser recriadas após `scripts/cleanup-supabase.ts --confirm`

## E-mail

- **Resend** para contato, auth e (futuro) YouTube linking
- Variáveis: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- `SMTP_*` não é usado pelo código

## Docker local

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis supabase
```

O serviço `backend` (imagem custom) não é necessário para o site Next.js na Vercel.
