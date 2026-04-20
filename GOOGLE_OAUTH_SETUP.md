# Guia: Configurar Google OAuth (Resolver redirect_uri_mismatch)

## 🚨 Erro Atual

```
Erro 400: redirect_uri_mismatch
```

**Causa**: O Google não reconhece a URL de callback que você está usando.

---

## ✅ Solução: Adicionar URLs no Google Cloud Console

### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Faça login com sua conta Google
3. Selecione seu projeto (ou crie um novo)

### Passo 2: Configurar OAuth 2.0 Client ID

1. Clique em **"OAuth 2.0 Client IDs"**
2. Encontre seu Client ID
3. Clique nele para editar

### Passo 3: Adicionar URIs Autorizadas

Na seção **"Authorized redirect URIs"**, adicione estas 3 URLs:

```
https://www.gabrieltoth.com/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
http://127.0.0.1:3000/api/auth/google/callback
```

**Por quê 3 URLs?**
- `https://www.gabrieltoth.com/...` → Produção (Vercel)
- `http://localhost:3000/...` → Desenvolvimento local
- `http://127.0.0.1:3000/...` → Desenvolvimento local (alternativa)

### Passo 4: Salvar

1. Clique em **"Save"** (Salvar)
2. Aguarde **5 minutos** para as mudanças propagarem

### Passo 5: Testar

1. Acesse: https://www.gabrieltoth.com/pt-BR/register
2. Clique em "Login with Google"
3. Deve funcionar agora!

---

## 🔍 Verificar Configuração Atual

Para ver quais URIs estão configuradas:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no seu OAuth 2.0 Client ID
3. Role até "Authorized redirect URIs"
4. Verifique se as 3 URLs acima estão lá

---

## ⚠️ Problemas Comuns

### Erro persiste após adicionar URIs

**Solução**: Aguarde 5-10 minutos. O Google demora para propagar as mudanças.

### Não encontro meu Client ID

**Solução**: 
1. Vá em: https://console.cloud.google.com/apis/credentials
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "OAuth 2.0 Client ID"
4. Escolha "Web application"
5. Adicione as 3 URIs acima

### Erro "invalid_client"

**Solução**: Verifique se o `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos na Vercel.

---

## 📋 Checklist

- [ ] Acessei Google Cloud Console
- [ ] Encontrei meu OAuth 2.0 Client ID
- [ ] Adicionei as 3 URIs de redirect
- [ ] Salvei as mudanças
- [ ] Aguardei 5 minutos
- [ ] Testei o login
- [ ] Funcionou!

---

**Última atualização**: 2025-01-19
