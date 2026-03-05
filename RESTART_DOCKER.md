# 🔄 Reiniciar Docker e Containers

## ⚠️ Situação Atual

O Docker Desktop foi desligado durante o processo de correção das mensagens de tradução.

## 🔧 Como Reiniciar

### Opção 1: Reiniciar Docker Desktop (Recomendado)

1. **Abra o Docker Desktop** manualmente:
   - Procure por "Docker Desktop" no menu Iniciar
   - Clique para abrir
   - Aguarde até que o ícone na bandeja do sistema fique verde

2. **Aguarde 30-60 segundos** para o Docker estar totalmente pronto

3. **Verifique se está funcionando**:
   ```powershell
   docker ps
   ```

### Opção 2: Reiniciar via PowerShell

```powershell
# Reiniciar o serviço Docker
Restart-Service -Name "com.docker.service" -Force

# Aguardar
Start-Sleep -Seconds 30

# Verificar status
docker ps
```

## 🚀 Iniciar os Containers

Após o Docker estar funcionando:

```powershell
# Iniciar todos os containers
docker compose -f docker/docker-compose.yml up -d

# Ou iniciar apenas o app
docker compose -f docker/docker-compose.yml up -d app

# Verificar status
docker compose -f docker/docker-compose.yml ps

# Ver logs do app
docker compose -f docker/docker-compose.yml logs -f app
```

## ✅ Verificar se Funcionou

1. Abra o navegador
2. Acesse: `http://localhost:3000`
3. Verifique se:
   - ✅ A página carrega sem erros
   - ✅ Os botões "Login" e "Register" aparecem
   - ✅ Não há mensagens de erro no console

## 📊 Status dos Containers

```
NAME                IMAGE                STATUS
platform-postgres   postgres:17-alpine   Healthy
platform-redis      redis:7-alpine       Healthy
platform-backend    platform-backend     Healthy
platform-app        platform-app         Running
```

## 🆘 Se Ainda Houver Problemas

1. **Limpar tudo e recomeçar**:
   ```powershell
   docker compose -f docker/docker-compose.yml down -v
   docker system prune -f
   docker compose -f docker/docker-compose.yml up -d
   ```

2. **Verificar logs detalhados**:
   ```powershell
   docker compose -f docker/docker-compose.yml logs app --tail 100
   ```

3. **Reconstruir a imagem do app**:
   ```powershell
   docker compose -f docker/docker-compose.yml build --no-cache app
   docker compose -f docker/docker-compose.yml up -d app
   ```

---

**Nota**: As correções de tradução já foram aplicadas aos arquivos. Apenas é necessário reiniciar o Docker e os containers.
