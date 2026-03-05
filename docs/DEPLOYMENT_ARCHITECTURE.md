# Arquitetura de Deployment

## Diagrama da Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   VERCEL (Frontend)            │
        │   - Next.js App                │
        │   - Static Assets              │
        │   - Edge Functions             │
        │   - CDN Global                 │
        │   URL: seu-dominio.com         │
        └────────────┬───────────────────┘
                     │
                     │ HTTPS
                     │
        ┌────────────▼───────────────────┐
        │   RAILWAY (Backend)            │
        │   - Node.js API                │
        │   - Express/Fastify            │
        │   - Rate Limiting              │
        │   - Auth                       │
        │   URL: api.seu-dominio.com     │
        └────────────┬───────────────────┘
                     │
                     │ TCP
                     │
        ┌────────────▼───────────────────┐
        │   RAILWAY (Database)           │
        │   - PostgreSQL 16              │
        │   - Backups Automáticos        │
        │   - Replicação                 │
        │   - 5GB Free                   │
        └────────────────────────────────┘
```

---

## Fluxo de Requisição

```
1. Usuário acessa: https://seu-dominio.com
   ↓
2. Vercel CDN retorna HTML/CSS/JS
   ↓
3. Frontend faz requisição: GET /api/data
   ↓
4. Railway Backend processa
   ↓
5. Backend consulta PostgreSQL
   ↓
6. Resposta volta para Frontend
   ↓
7. Página renderiza com dados
```

---

## Componentes

### Frontend (Vercel)

```
Vercel
├── Next.js 14+
├── React 18+
├── TypeScript
├── Tailwind CSS
├── Lucide Icons
└── next-intl (i18n)

Recursos:
- 100GB bandwidth/mês (free)
- Builds ilimitados
- Deployments automáticos
- Preview URLs
- Analytics
```

### Backend (Railway)

```
Railway
├── Node.js 20
├── Express/Fastify
├── TypeScript
├── Prisma ORM
├── JWT Auth
└── Rate Limiting

Recursos:
- $5 crédito/mês (free)
- 750 horas/mês
- Auto-scaling
- Health checks
- Logs em tempo real
```

### Database (Railway PostgreSQL)

```
PostgreSQL 16
├── 5GB storage (free)
├── Backups automáticos
├── Replicação
├── SSL/TLS
└── Monitoring

Recursos:
- Conexões ilimitadas
- Queries ilimitadas
- Backups diários
- Restore point-in-time
```

---

## Fluxo de Deploy

### Automático (Recomendado)

```
1. Push para main branch
   ↓
2. GitHub webhook dispara
   ↓
3. Vercel detecta mudanças
   ↓
4. Build automático
   ↓
5. Deploy automático
   ↓
6. URL preview gerada
   ↓
7. Merge para produção
   ↓
8. Deploy automático em prod
```

### Manual

```bash
# Frontend
vercel --prod

# Backend
railway up

# Ambos
./scripts/deploy.sh all
```

---

## Segurança

### HTTPS/TLS

```
✅ Vercel: Automático com Let's Encrypt
✅ Railway: Automático com Let's Encrypt
✅ Certificados renovados automaticamente
```

### Variáveis de Ambiente

```
Vercel:
- Criptografadas em repouso
- Não expostas no código
- Diferentes por ambiente

Railway:
- Criptografadas em repouso
- Não expostas em logs
- Diferentes por serviço
```

### Banco de Dados

```
✅ Conexão SSL/TLS obrigatória
✅ Firewall automático
✅ Backups criptografados
✅ Acesso restrito por IP (opcional)
```

---

## Monitoramento

### Vercel

```
Dashboard:
- Build times
- Deployment history
- Performance metrics
- Error tracking
- Analytics

CLI:
vercel logs --follow
```

### Railway

```
Dashboard:
- CPU usage
- Memory usage
- Network I/O
- Deployment logs
- Database metrics

CLI:
railway logs --follow
```

---

## Escalabilidade

### Fase 1: Baixo Volume (Atual)

```
Vercel Free + Railway Free
- Custo: $0
- Usuários: 0-100
- Requisições: 0-1000/dia
```

### Fase 2: Crescimento Moderado

```
Vercel Pro ($20) + Railway Starter ($5)
- Custo: $25/mês
- Usuários: 100-1000
- Requisições: 1000-10000/dia
```

### Fase 3: Escala Média

```
Vercel Pro + Railway Standard ($50)
- Custo: $70/mês
- Usuários: 1000-10000
- Requisições: 10000-100000/dia
```

### Fase 4: Escala Grande

```
Vercel Enterprise + Railway Pro ($200+)
- Custo: $300+/mês
- Usuários: 10000+
- Requisições: 100000+/dia
```

---

## Backup & Disaster Recovery

### Banco de Dados

```
Railway PostgreSQL:
- Backups automáticos diários
- Retenção: 7 dias
- Restore point-in-time
- Replicação automática
```

### Código

```
GitHub:
- Histórico completo
- Branches de backup
- Tags de release
- Rollback fácil
```

### Configuração

```
Documentação:
- .env.production.example
- railway.json
- vercel.json
- docker-compose.prod.yml
```

---

## Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] CORS configurado
- [ ] Rate limiting ativado
- [ ] Logs centralizados
- [ ] Monitoramento ativado
- [ ] Backups testados
- [ ] Domínio customizado
- [ ] SSL/TLS verificado
- [ ] Alertas configurados

---

## Contatos de Suporte

| Serviço | Suporte | Docs |
|---------|---------|------|
| Vercel | support@vercel.com | vercel.com/docs |
| Railway | support@railway.app | railway.app/docs |
| PostgreSQL | postgresql.org | postgresql.org/docs |

---

## Referências

- [Vercel Deployment](https://vercel.com/docs)
- [Railway Documentation](https://railway.app/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
