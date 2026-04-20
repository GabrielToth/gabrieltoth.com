# Guia Completo: Configurar Variáveis na Vercel

## 🎯 Conceito Simples

Na Vercel, você tem **um único lugar** para adicionar variáveis: o painel de Environment Variables.

**Regra de Ouro**:
- ✅ Variáveis com `NEXT_PUBLIC_` → Visíveis no navegador (públicas)
- ✅ Variáveis SEM `NEXT_PUBLIC_` → Invisíveis no navegador (privadas/server-side)

---

## 📝 Passo a Passo na Vercel

### 1. Acesse o Painel
1. Vá para: https://vercel.com/seu-projeto/settings/environment-variables
2. Você verá uma lista de variáveis

### 2. Adicione as Variáveis Necessárias

**IMPORTANTE**: Use os valores do seu `.env.local` ou `.env.production`

---

## 🔑 Variáveis para Adicionar na Vercel

### ✅ Grupo 1: Google OAuth (OBRIGATÓRIO para login funcionar)

```
Nome: NEXT_PUBLIC_GOOGLE_CLIENT_ID
Valor: [Copie do seu .env.local]
Ambiente: Production, Preview, Development
```

```
Nome: NEXT_PUBLIC_GOOGLE_REDIRECT_URI
Valor: https://www.gabrieltoth.com/api/auth/google/callback
Ambiente: Production
```

```
Nome: GOOGLE_CLIENT_SECRET
Valor: [Copie do seu .env.local]
Ambiente: Production, Preview, Development
```

---

### ✅ Grupo 2: Supabase (Banco de Dados)

```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: [Copie do seu .env.local]
Ambiente: Production, Preview, Development
```

```
Nome: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production, Preview, Development
```

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production, Preview, Development
```

---

### ✅ Grupo 3: Configurações Gerais

```
Nome: NODE_ENV
Valor: production
Ambiente: Production
```

```
Nome: BASE_URL
Valor: https://www.gabrieltoth.com
Ambiente: Production
```

```
Nome: APP_URL
Valor: https://www.gabrieltoth.com
Ambiente: Production
```

```
Nome: NEXT_PUBLIC_DEBUG
Valor: false
Ambiente: Production
```

---

### ✅ Grupo 4: WhatsApp (se usar)

```
Nome: WHATSAPP_ACCESS_TOKEN
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: WHATSAPP_PHONE_NUMBER_ID
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: WHATSAPP_VERIFY_TOKEN
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 5: PIX (se usar)

```
Nome: PIX_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: PIX_MERCHANT_NAME
Valor: [Seu nome]
Ambiente: Production
```

```
Nome: PIX_MERCHANT_CITY
Valor: [Sua cidade]
Ambiente: Production
```

---

### ✅ Grupo 6: Monero (se usar)

```
Nome: MONERO_ADDRESS
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: MONERO_VIEW_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 7: Amazon (se usar)

```
Nome: NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 8: Meta/Facebook (se usar)

```
Nome: META_APP_ID
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: META_APP_SECRET
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 9: Instagram (se usar)

```
Nome: INSTAGRAM_APP_ID
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: INSTAGRAM_APP_SECRET
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 10: TikTok (se usar)

```
Nome: TIKTOK_CLIENT_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: TIKTOK_CLIENT_SECRET
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 11: AWS (se usar)

```
Nome: AWS_ACCESS_KEY_ID
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: AWS_SECRET_ACCESS_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: AWS_REGION
Valor: us-east-1
Ambiente: Production
```

---

### ✅ Grupo 12: Stripe (se usar)

```
Nome: STRIPE_PUBLIC_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: STRIPE_SECRET_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 13: Discord (se usar)

```
Nome: DISCORD_WEBHOOK_URL
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 14: Postman (se usar)

```
Nome: POSTMAN_API_KEY
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

### ✅ Grupo 15: Encryption (se usar)

```
Nome: ENCRYPTION_KEY
Valor: [Gere uma chave de 32 bytes]
Ambiente: Production
```

---

### ✅ Grupo 16: Database (se usar)

```
Nome: DATABASE_URL
Valor: [Copie do seu .env.local]
Ambiente: Production
```

```
Nome: REDIS_URL
Valor: [Copie do seu .env.local]
Ambiente: Production
```

---

## 🔄 Após Adicionar as Variáveis

1. **Redeploy** o projeto:
   - Vá em: Deployments → Clique nos 3 pontinhos → Redeploy
   - Ou faça um novo commit e push

2. **Teste o login**:
   - Acesse: https://www.gabrieltoth.com/pt-BR/register
   - Clique em "Login with Google"
   - Deve funcionar!

---

## ❓ FAQ

### P: Por que algumas variáveis têm `NEXT_PUBLIC_` e outras não?

**R**: 
- `NEXT_PUBLIC_` = Visível no navegador (qualquer pessoa pode ver)
- Sem `NEXT_PUBLIC_` = Invisível no navegador (só o servidor da Vercel vê)

**Exemplo**:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → OK ser público (é só um ID)
- `GOOGLE_CLIENT_SECRET` → NÃO pode ser público (é uma senha)

### P: O que é "server-side" na Vercel?

**R**: É o código que roda **no servidor da Vercel**, não no navegador do usuário. Quando você usa variáveis sem `NEXT_PUBLIC_`, elas só existem no servidor.

### P: Preciso adicionar todas essas variáveis?

**R**: Depende do que você usa:
- **Obrigatório para login**: Grupo 1 (Google OAuth) e Grupo 2 (Supabase)
- **Opcional**: Outros grupos (só se você usar esses serviços)

### P: Como sei se uma variável está funcionando?

**R**: Após redeploy, acesse seu site e teste. Se der erro "not configured", a variável não foi adicionada corretamente.

---

## 🆘 Problemas Comuns

### Erro: "Google Client ID not configured"

**Solução**:
1. Verifique se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está na Vercel
2. Verifique se o valor está correto (sem espaços extras)
3. Redeploy o projeto

### Erro: "Redirect URI mismatch"

**Solução**:
1. Vá no Google Cloud Console
2. Adicione `https://www.gabrieltoth.com/api/auth/google/callback` nas URIs autorizadas
3. Aguarde 5 minutos para propagar

---

## ✅ Checklist Final

- [ ] Adicionei todas as variáveis do Grupo 1 (Google OAuth)
- [ ] Adicionei todas as variáveis do Grupo 2 (Supabase)
- [ ] Adicionei variáveis dos outros grupos que uso
- [ ] Fiz redeploy na Vercel
- [ ] Testei o login com Google
- [ ] Login funcionou!

---

**Última atualização**: 2025-01-19
