# Google OAuth - Variáveis de Ambiente

## Entendendo NEXT_PUBLIC_ vs Variáveis Normais

### Variáveis SEM `NEXT_PUBLIC_` (Server-Only)
- **Disponíveis apenas no servidor** (API routes, server components)
- **NUNCA expostas ao navegador** do usuário
- Usadas para **secrets e dados sensíveis**
- Exemplo: `GOOGLE_CLIENT_SECRET`

### Variáveis COM `NEXT_PUBLIC_` (Client + Server)
- **Disponíveis no servidor E no cliente** (navegador)
- **Expostas publicamente** no JavaScript do navegador
- Usadas para dados que o **frontend precisa acessar**
- Exemplo: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Variáveis Necessárias para Google OAuth

### 1. Client-Side (Frontend - Botão de Login)

```env
# Usado pelo botão de login no navegador
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://www.gabrieltoth.com/api/auth/google/callback
```

**Onde é usado:**
- `src/components/auth/google-login-button.tsx` - Para construir a URL de autorização do Google

**Por que é público:**
- O navegador precisa saber o Client ID para iniciar o fluxo OAuth
- O redirect URI é validado pelo Google contra a configuração do OAuth app
- Não há risco de segurança em expor essas informações

### 2. Server-Side (Backend - Validação e Troca de Token)

```env
# Usado pelo servidor para validar tokens
GOOGLE_CLIENT_ID=1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
# NUNCA expor ao cliente - usado para trocar código por token
GOOGLE_CLIENT_SECRET=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
```

**Onde é usado:**
- `src/lib/auth/google-auth.ts` - Para validar tokens e trocar código de autorização
- `src/app/api/auth/google/callback/route.ts` - Para processar o callback do Google

**Por que é privado:**
- `GOOGLE_CLIENT_SECRET` é um secret que NUNCA deve ser exposto
- `GOOGLE_CLIENT_ID` é usado para validar que o token foi emitido para nossa aplicação

## Fluxo Completo

```
1. Usuário clica em "Login with Google"
   └─> google-login-button.tsx usa NEXT_PUBLIC_GOOGLE_CLIENT_ID
   └─> Redireciona para Google com NEXT_PUBLIC_GOOGLE_REDIRECT_URI

2. Google autentica o usuário e redireciona de volta
   └─> URL: https://www.gabrieltoth.com/api/auth/google/callback?code=...

3. Servidor processa o callback
   └─> callback/route.ts usa NEXT_PUBLIC_GOOGLE_REDIRECT_URI (deve ser igual ao do cliente)
   └─> google-auth.ts usa GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
   └─> Troca o código por um ID token
   └─> Valida o token
   └─> Cria sessão e redireciona para /dashboard
```

## Configuração na Vercel

### Variáveis que DEVEM estar na Vercel:

```
# Client-side (podem ser "Sensitive" mas serão expostas)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://www.gabrieltoth.com/api/auth/google/callback

# Server-side (DEVEM ser "Sensitive" e "Encrypted")
GOOGLE_CLIENT_ID=1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Nota Importante sobre NEXT_PUBLIC_GOOGLE_REDIRECT_URI

O callback do servidor usa `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` porque:
1. O redirect URI deve ser **exatamente igual** ao enviado pelo cliente
2. O Google valida que o redirect URI no callback é o mesmo usado na autorização
3. Não é um problema de segurança - o redirect URI é público e validado pelo Google

## Verificação

Para verificar se as variáveis estão corretas:

1. **No navegador (DevTools Console):**
   ```javascript
   // Estas devem estar disponíveis:
   process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
   process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
   
   // Estas NÃO devem estar disponíveis (undefined):
   process.env.GOOGLE_CLIENT_SECRET
   ```

2. **No servidor (logs):**
   ```typescript
   // Todas devem estar disponíveis:
   console.log(process.env.GOOGLE_CLIENT_ID)
   console.log(process.env.GOOGLE_CLIENT_SECRET)
   console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
   console.log(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI)
   ```

## Segurança

✅ **Seguro:**
- Expor `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no navegador
- Expor `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` no navegador

❌ **NUNCA expor:**
- `GOOGLE_CLIENT_SECRET` no navegador
- `GOOGLE_CLIENT_SECRET` em logs públicos
- `GOOGLE_CLIENT_SECRET` em repositórios Git

## Troubleshooting

### Erro: "Google redirect URI not configured"
- Verifique se `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` está definida na Vercel
- Verifique se a variável está marcada para o ambiente correto (Production/Preview)

### Erro: "Google OAuth credentials not configured"
- Verifique se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão definidas na Vercel
- Verifique se as variáveis estão marcadas como "Sensitive"

### Erro: "redirect_uri_mismatch"
- O redirect URI no Google Cloud Console deve incluir:
  - `https://www.gabrieltoth.com/api/auth/google/callback`
- Verifique se `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` tem exatamente esse valor
