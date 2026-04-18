# 🔧 Instruções de Configuração MCP

## Pré-requisitos

1. **Instalar `uv` e `uvx`**
   ```bash
   # Windows (PowerShell)
   irm https://astral.sh/uv/install.ps1 | iex
   
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Verificar instalação**
   ```bash
   uv --version
   uvx --version
   ```

## Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local` na raiz do projeto:

### AWS (Recomendado)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```
**Obter em:** https://console.aws.amazon.com/iam/

### Postman (Opcional - via Power)
Se você tem a chave Postman, adicione:
```
POSTMAN_API_KEY=your_api_key_here
```
**Obter em:** https://web.postman.co/settings/me/api-keys

### Supabase (Opcional - via Power)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
**Obter em:** https://app.supabase.com/project/[project-id]/settings/api

## Reiniciar Kiro

Após adicionar as variáveis de ambiente:

1. Feche o Kiro completamente
2. Reabra o Kiro
3. Os servidores MCP devem conectar automaticamente

## Verificar Status

No Kiro, abra a paleta de comandos (Ctrl+Shift+P) e procure por "MCP" para ver o status dos servidores.

## Servidores MCP Disponíveis

### Habilitados por Padrão
- **AWS MCP** - Acesso a serviços AWS (CloudWatch, CloudTrail, etc.)

### Disponíveis via Powers
- **Postman** - Gerenciamento de coleções e testes de API
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **Stripe** - Processamento de pagamentos
- **Google Cloud** - YouTube, Gmail, Google Drive
- **Meta/Facebook** - Facebook, Instagram, WhatsApp
- **TikTok** - Integração com TikTok
- **GitHub** - Gerenciamento de repositórios

## Troubleshooting

### Erro: "Command not found: uvx"
- Reinstale `uv` seguindo as instruções acima
- Reinicie o terminal/Kiro

### Erro: "Invalid API Key"
- Verifique se a chave está correta em `.env.local`
- Certifique-se de que não há espaços extras
- Regenere a chave se necessário

### Erro: "Connection refused"
- Verifique sua conexão de internet
- Tente desabilitar e reabilitar o servidor MCP
- Reinicie o Kiro

### Erro: "Package not found"
- Verifique se `uv` está instalado corretamente
- Tente executar `uvx --version` no terminal
- Reinstale `uv` se necessário

## Segurança

⚠️ **IMPORTANTE:**
- Nunca compartilhe suas chaves de API
- Nunca faça commit de `.env.local` com chaves reais
- Use `.env.local` apenas localmente
- Para produção, use variáveis de ambiente do sistema
- As chaves em `.env.local` são ignoradas pelo Git automaticamente
