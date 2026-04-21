# 📋 Listas de Limpeza de Variáveis de Ambiente

---

## ❌ REMOVER da Vercel (18 variáveis)

### Duplicadas
1. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### MercadoPago (usando Stripe)
2. `MERCADOPAGO_ACCESS_TOKEN`
3. `MERCADOPAGO_CLIENT_ID`
4. `MERCADOPAGO_CLIENT_SECRET`
5. `MERCADOPAGO_PUBLIC_KEY`

### PIX (será removido do projeto)
6. `PIX_KEY`
7. `PIX_MERCHANT_CITY`
8. `PIX_MERCHANT_NAME`

### Excluído do Projeto
9. `CDP_ENDPOINT`

### AWS (apenas CI/CD)
10. `AWS_ACCESS_KEY_ID`
11. `AWS_PROFILE`
12. `AWS_REGION`
13. `AWS_SECRET_ACCESS_KEY`

### Docker (apenas docker-compose.yml)
14. `BASE_URL`
15. `POSTGRES_DB`
16. `POSTGRES_PASSWORD`
17. `POSTGRES_USER`

### Não Implementado
18. `REDIS_URL`

---

## ⚠️ REVISAR (6 variáveis)

### Verificar se precisa em Vercel
1. `DATABASE_URL` - Vercel fornece automaticamente?
2. `SUPABASE_SERVICE_ROLE_KEY` - Precisa em produção ou apenas testes?
3. `GITHUB_TOKEN` - Algum MCP precisa?
4. `POSTMAN_API_KEY` - Algum MCP precisa?

### Desativar em Production
5. `DEBUG` - Manter true em Dev/Preview, false em Production
6. `NEXT_PUBLIC_DEBUG` - Manter true em Dev/Preview, false em Production

### Investigar
7. `WHATSAPP_ACCESS_TOKEN` - Por que não funciona?
8. `WHATSAPP_PHONE_NUMBER_ID` - Por que não funciona?
9. `WHATSAPP_VERIFY_TOKEN` - Por que não funciona?

---

## ✅ MANTER na Vercel (9 variáveis)

1. `DISCORD_WEBHOOK_URL`
2. `GOOGLE_CLIENT_ID` (adicionar!)
3. `GOOGLE_CLIENT_SECRET`
4. `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`
5. `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
6. `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
7. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
8. `NEXT_PUBLIC_SUPABASE_URL`
9. `STRIPE_SECRET_KEY`
10. `SEND_DISCORD_IN_TESTS`
11. `MONERO_ADDRESS`
12. `MONERO_VIEW_KEY`

---

## 🔄 TO-DO FUTURO (Não adicionar agora)

### Quando implementar "Video Upload Multi-Platform"
- `APP_URL`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `META_APP_ID`
- `META_APP_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

### Quando implementar "Login com Discord"
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID`
- `DISCORD_REDIRECT_URI`

### Quando implementar "Unificação de Chats de Streaming"
- `KICK_BROADCASTER_USER_ID`
- `KICK_CHATROOM_ID`
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`
- `KICK_REDIRECT_URI`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI`

### Quando implementar "Sistema de Pagamento Monero"
- (Já tem `MONERO_ADDRESS` e `MONERO_VIEW_KEY`)

### Quando implementar "Remover PIX"
- Remover `PIX_KEY`, `PIX_MERCHANT_CITY`, `PIX_MERCHANT_NAME`

### Quando implementar "Cache com Redis"
- `REDIS_URL` (adicionar depois)

---

**Total**: 63 variáveis
- ✅ Manter: 12
- ❌ Remover: 18
- ⚠️ Revisar: 9
- 🔄 To-Do: 24
