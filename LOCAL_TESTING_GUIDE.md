# Guia de Testes Locais com Docker

## Commits Realizados

### ✅ Commit 1: Páginas de Autenticação
- **Hash**: 80231d3
- **Mudanças**: Adicionadas páginas de login e registro
- **Arquivos**: 
  - `src/app/[locale]/login/page.tsx`
  - `src/app/[locale]/register/page.tsx`

### ✅ Commit 2: Traduções de Autenticação
- **Hash**: f527cbf
- **Mudanças**: Adicionadas traduções em 4 idiomas
- **Arquivos**:
  - `src/i18n/pt-BR/auth.json`
  - `src/i18n/en/auth.json`
  - `src/i18n/es/auth.json`
  - `src/i18n/de/auth.json`

### ✅ Commit 3: Reorganização do Header
- **Hash**: bb58822
- **Mudanças**: Reorganizados botões no header
- **Arquivos**:
  - `src/components/layout/header.tsx`

### ✅ Commit 4: Página 404 com Header/Footer
- **Hash**: f2739ae
- **Mudanças**: Adicionados header e footer na página 404
- **Arquivos**:
  - `src/app/not-found.tsx`

## Como Testar Localmente

### Pré-requisitos
- Docker Desktop instalado e rodando
- Docker Compose
- Node.js 22+ (opcional, para testes sem Docker)

### Opção 1: Com Docker Compose

```bash
# Iniciar todos os serviços
docker-compose -f docker/docker-compose.yml up -d

# Verificar status
docker-compose -f docker/docker-compose.yml ps

# Ver logs
docker-compose -f docker/docker-compose.yml logs -f app

# Parar serviços
docker-compose -f docker/docker-compose.yml down
```

### Opção 2: Sem Docker (Desenvolvimento Local)

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Acessar em http://localhost:3000
```

## URLs para Testar

### Páginas de Autenticação
- **Login PT-BR**: http://localhost:3000/pt-BR/login
- **Register PT-BR**: http://localhost:3000/pt-BR/register
- **Login EN**: http://localhost:3000/en/login
- **Register EN**: http://localhost:3000/en/register
- **Login ES**: http://localhost:3000/es/login
- **Register ES**: http://localhost:3000/es/register
- **Login DE**: http://localhost:3000/de/login
- **Register DE**: http://localhost:3000/de/register

### Página 404
- **404 Page**: http://localhost:3000/pagina-inexistente

### Header
- **Home**: http://localhost:3000/pt-BR
- Verificar botões de Login/Register no header
- Verificar Language Selector e Theme Toggle à esquerda

## Testes Funcionais

### ✅ Login Page
- [ ] Página carrega corretamente
- [ ] Formulário com email e senha
- [ ] Checkbox "Remember me"
- [ ] Link "Forgot password"
- [ ] Link para Register funciona
- [ ] Dark mode funciona
- [ ] Responsivo em mobile

### ✅ Register Page
- [ ] Página carrega corretamente
- [ ] Formulário com name, email, password, confirm password
- [ ] Validação de campos obrigatórios
- [ ] Link para Login funciona
- [ ] Dark mode funciona
- [ ] Responsivo em mobile

### ✅ Header
- [ ] Language Selector à esquerda
- [ ] Theme Toggle à esquerda
- [ ] Login button à direita
- [ ] Register button à direita
- [ ] Menu mobile reorganizado
- [ ] Todos os links funcionam

### ✅ 404 Page
- [ ] Header aparece
- [ ] Footer aparece
- [ ] Botões de navegação funcionam
- [ ] Dark mode funciona
- [ ] Responsivo em mobile

## Traduções Testadas

### Português (pt-BR)
- Login: "Entrar"
- Register: "Criar Conta"
- Email: "E-mail"
- Password: "Senha"

### English (en)
- Login: "Sign In"
- Register: "Create Account"
- Email: "Email"
- Password: "Password"

### Español (es)
- Login: "Iniciar Sesión"
- Register: "Crear Cuenta"
- Email: "Correo Electrónico"
- Password: "Contraseña"

### Deutsch (de)
- Login: "Anmelden"
- Register: "Konto Erstellen"
- Email: "E-Mail"
- Password: "Passwort"

## Próximos Passos

1. ✅ Testar todas as páginas localmente
2. ✅ Verificar traduções em todos os idiomas
3. ✅ Testar dark mode
4. ✅ Testar responsividade
5. ⏳ Implementar lógica de autenticação (backend)
6. ⏳ Adicionar validação de formulário (frontend)
7. ⏳ Integrar com banco de dados
8. ⏳ Adicionar testes automatizados

## Troubleshooting

### Docker não inicia
```bash
# Reiniciar Docker Desktop
# Ou usar WSL:
wsl --shutdown
wsl -d docker-desktop
```

### Porta 3000 já em uso
```bash
# Encontrar processo usando porta 3000
netstat -ano | findstr :3000

# Matar processo (Windows)
taskkill /PID <PID> /F
```

### Erro de conexão com banco de dados
```bash
# Verificar se containers estão rodando
docker ps

# Verificar logs
docker logs platform-postgres
docker logs platform-redis
```

## Notas Importantes

- As páginas de login/register são apenas UI por enquanto
- A lógica de autenticação será implementada no próximo sprint
- Todas as traduções estão completas
- Dark mode está totalmente funcional
- Design é responsivo para todos os tamanhos de tela
