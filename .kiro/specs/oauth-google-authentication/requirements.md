# Requisitos - OAuth Google Authentication

## Introdução

Este documento especifica os requisitos para implementar um sistema de autenticação simplificado baseado exclusivamente em OAuth do Google. O sistema remove toda a complexidade de autenticação com formulário (email/senha), confirmação de email, reset de senha e recuperação de conta, substituindo-os por um fluxo único e direto de login via Google OAuth.

## Glossário

- **Google_OAuth**: Serviço de autenticação do Google que permite login seguro via conta Google
- **Google_ID**: Identificador único fornecido pelo Google para cada usuário
- **Session**: Sessão de usuário autenticado mantida no servidor
- **HTTP_Only_Cookie**: Cookie que não pode ser acessado via JavaScript, apenas via HTTP
- **CSRF_Token**: Token para proteção contra ataques Cross-Site Request Forgery
- **Audit_Log**: Registro de eventos de segurança (login, logout)
- **Dashboard**: Página protegida acessível apenas para usuários autenticados
- **User_Profile**: Dados do usuário armazenados no banco de dados (email, nome, foto)
- **Authentication_System**: Sistema responsável por gerenciar login, logout e sessões
- **Frontend_Component**: Componente React para interface do usuário
- **Backend_Service**: Serviço Node.js/Express que gerencia autenticação

## Requisitos

### Requisito 1: Login com Google OAuth

**User Story:** Como usuário, quero fazer login com minha conta Google, para que eu possa acessar a aplicação de forma rápida e segura.

#### Critérios de Aceitação

1. WHEN o usuário clica no botão "Login com Google", THE Authentication_System SHALL redirecionar para a página de consentimento do Google
2. WHEN o usuário autoriza o acesso, THE Google_OAuth SHALL retornar um código de autorização
3. WHEN o código de autorização é recebido, THE Backend_Service SHALL trocar o código por um token de acesso do Google
4. WHEN o token de acesso é obtido, THE Backend_Service SHALL validar o token com os servidores do Google
5. IF o token for inválido, THEN THE Backend_Service SHALL retornar um erro de autenticação
6. WHEN o token é validado com sucesso, THE Authentication_System SHALL extrair os dados do usuário (email, nome, foto, google_id)

### Requisito 2: Registro Automático na Primeira Autenticação

**User Story:** Como novo usuário, quero que minha conta seja criada automaticamente na primeira vez que faço login com Google, para que eu não precise preencher formulários.

#### Critérios de Aceitação

1. WHEN um usuário faz login com Google pela primeira vez, THE Backend_Service SHALL verificar se o usuário existe no banco de dados
2. IF o usuário não existe, THEN THE Backend_Service SHALL criar um novo registro na tabela users
3. WHEN o novo usuário é criado, THE Backend_Service SHALL armazenar: google_id, google_email, google_name, google_picture
4. WHEN o usuário é criado, THE Audit_Log SHALL registrar um evento de "novo usuário criado via Google OAuth"
5. WHEN o usuário já existe, THE Backend_Service SHALL atualizar os dados do perfil (nome, foto) se tiverem mudado no Google

### Requisito 3: Armazenamento de Dados do Usuário

**User Story:** Como administrador, quero que os dados do usuário do Google sejam armazenados de forma segura, para que eu possa manter um registro confiável dos usuários.

#### Critérios de Aceitação

1. THE Backend_Service SHALL armazenar os seguintes campos na tabela users: google_id, google_email, google_name, google_picture
2. THE Backend_Service SHALL remover os campos: password_hash, email_verified, password_reset_token, email_verification_token
3. WHEN um usuário faz login, THE Backend_Service SHALL atualizar o campo updated_at com o timestamp atual
4. THE Backend_Service SHALL manter um índice único em google_id para garantir que cada Google_ID seja associado a apenas um usuário
5. WHEN dados do usuário são armazenados, THE Backend_Service SHALL validar que google_id, google_email e google_name não sejam nulos

### Requisito 4: Manutenção de Sessão Após Login

**User Story:** Como usuário autenticado, quero que minha sessão seja mantida após o login, para que eu não precise fazer login novamente a cada página visitada.

#### Critérios de Aceitação

1. WHEN o login é bem-sucedido, THE Authentication_System SHALL criar uma nova sessão no banco de dados
2. WHEN a sessão é criada, THE Backend_Service SHALL gerar um session_id único
3. WHEN a sessão é criada, THE Backend_Service SHALL armazenar: user_id, session_id, created_at, expires_at
4. WHEN a sessão é criada, THE Backend_Service SHALL enviar um HTTP_Only_Cookie contendo o session_id
5. WHEN o usuário faz uma requisição, THE Backend_Service SHALL validar o session_id do cookie
6. IF o session_id for válido e não expirado, THEN THE Backend_Service SHALL permitir acesso aos recursos protegidos
7. IF o session_id for inválido ou expirado, THEN THE Backend_Service SHALL redirecionar para a página de login
8. THE Backend_Service SHALL definir o tempo de expiração da sessão como 30 dias

### Requisito 5: Logout

**User Story:** Como usuário autenticado, quero fazer logout, para que eu possa encerrar minha sessão de forma segura.

#### Critérios de Aceitação

1. WHEN o usuário clica no botão "Logout", THE Authentication_System SHALL remover a sessão do banco de dados
2. WHEN a sessão é removida, THE Backend_Service SHALL limpar o HTTP_Only_Cookie
3. WHEN o logout é realizado, THE Audit_Log SHALL registrar um evento de "usuário fez logout"
4. WHEN o logout é realizado, THE Frontend_Component SHALL redirecionar o usuário para a página de login
5. WHEN o usuário tenta acessar recursos protegidos após logout, THE Backend_Service SHALL retornar erro 401 Unauthorized

### Requisito 6: Dashboard para Usuário Autenticado

**User Story:** Como usuário autenticado, quero acessar um dashboard, para que eu possa ver meus dados e gerenciar minha conta.

#### Critérios de Aceitação

1. WHEN um usuário autenticado acessa a rota /dashboard, THE Frontend_Component SHALL exibir o dashboard
2. IF o usuário não está autenticado, THEN THE Frontend_Component SHALL redirecionar para a página de login
3. WHEN o dashboard é carregado, THE Frontend_Component SHALL exibir: nome do usuário, email, foto do perfil
4. WHEN o dashboard é carregado, THE Frontend_Component SHALL exibir um botão "Logout"
5. WHEN o usuário clica em "Logout", THE Authentication_System SHALL executar o logout conforme Requisito 5

### Requisito 7: Remoção de Rotas de Registro com Formulário

**User Story:** Como desenvolvedor, quero remover todas as rotas de registro com formulário, para que o sistema seja simplificado.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover as rotas: POST /api/auth/register, GET /auth/register
2. THE Frontend_Component SHALL remover o componente RegisterForm
3. WHEN um usuário tenta acessar /auth/register, THE Frontend_Component SHALL redirecionar para /auth/login
4. WHEN um usuário tenta fazer POST para /api/auth/register, THE Backend_Service SHALL retornar erro 404 Not Found

### Requisito 8: Remoção de Rotas de Email de Confirmação

**User Story:** Como desenvolvedor, quero remover todas as rotas de confirmação de email, para que o sistema seja simplificado.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover as rotas: GET /api/auth/verify-email, POST /api/auth/resend-verification
2. THE Backend_Service SHALL remover a tabela email_verification_tokens
3. WHEN um usuário tenta acessar /auth/verify-email, THE Frontend_Component SHALL redirecionar para /dashboard
4. WHEN um usuário tenta fazer POST para /api/auth/resend-verification, THE Backend_Service SHALL retornar erro 404 Not Found

### Requisito 9: Remoção de Rotas de Reset de Senha

**User Story:** Como desenvolvedor, quero remover todas as rotas de reset de senha, para que o sistema seja simplificado.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover as rotas: POST /api/auth/reset-password, GET /api/auth/reset-password/:token
2. THE Backend_Service SHALL remover a tabela password_reset_tokens
3. WHEN um usuário tenta acessar /auth/reset-password, THE Frontend_Component SHALL redirecionar para /dashboard
4. WHEN um usuário tenta fazer POST para /api/auth/reset-password, THE Backend_Service SHALL retornar erro 404 Not Found

### Requisito 10: Remoção de Rotas de Forgot Password

**User Story:** Como desenvolvedor, quero remover todas as rotas de forgot password, para que o sistema seja simplificado.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover as rotas: GET /auth/forgot-password, POST /api/auth/forgot-password
2. WHEN um usuário tenta acessar /auth/forgot-password, THE Frontend_Component SHALL redirecionar para /dashboard
3. WHEN um usuário tenta fazer POST para /api/auth/forgot-password, THE Backend_Service SHALL retornar erro 404 Not Found

### Requisito 11: Validação de Token do Google

**User Story:** Como administrador, quero que todos os tokens do Google sejam validados, para que apenas usuários autênticos possam acessar a aplicação.

#### Critérios de Aceitação

1. WHEN um token de acesso é recebido, THE Backend_Service SHALL validar o token com os servidores do Google usando a Google_OAuth API
2. IF o token for inválido, expirado ou revogado, THEN THE Backend_Service SHALL retornar um erro de autenticação
3. IF o token for válido, THEN THE Backend_Service SHALL extrair as informações do usuário (sub, email, name, picture)
4. WHEN o token é validado, THE Backend_Service SHALL verificar se o google_id já existe no banco de dados
5. THE Backend_Service SHALL usar a biblioteca google-auth-library para validação segura de tokens

### Requisito 12: Proteção CSRF

**User Story:** Como administrador, quero que a aplicação seja protegida contra ataques CSRF, para que as requisições sejam seguras.

#### Critérios de Aceitação

1. WHEN um usuário acessa a página de login, THE Backend_Service SHALL gerar um CSRF_Token único
2. WHEN o CSRF_Token é gerado, THE Backend_Service SHALL armazenar o token na sessão
3. WHEN uma requisição POST é feita, THE Backend_Service SHALL validar o CSRF_Token
4. IF o CSRF_Token for inválido ou ausente, THEN THE Backend_Service SHALL retornar erro 403 Forbidden
5. THE Backend_Service SHALL usar a biblioteca csrf para gerenciar tokens CSRF

### Requisito 13: Audit Logging para Login/Logout

**User Story:** Como administrador, quero registrar todos os eventos de login e logout, para que eu possa monitorar a segurança da aplicação.

#### Critérios de Aceitação

1. WHEN um usuário faz login com sucesso, THE Audit_Log SHALL registrar: user_id, timestamp, evento "login", IP do cliente, user_agent
2. WHEN um usuário faz logout, THE Audit_Log SHALL registrar: user_id, timestamp, evento "logout", IP do cliente, user_agent
3. WHEN um login falha, THE Audit_Log SHALL registrar: google_id, timestamp, evento "login_failed", motivo da falha, IP do cliente
4. THE Backend_Service SHALL armazenar os logs na tabela audit_logs
5. THE Backend_Service SHALL manter os logs por no mínimo 90 dias

### Requisito 14: HTTP-Only Cookies para Sessão

**User Story:** Como administrador, quero que as sessões sejam armazenadas em HTTP-Only cookies, para que elas não possam ser acessadas via JavaScript.

#### Critérios de Aceitação

1. WHEN uma sessão é criada, THE Backend_Service SHALL enviar um HTTP_Only_Cookie com o session_id
2. THE HTTP_Only_Cookie SHALL ter a flag HttpOnly definida como true
3. THE HTTP_Only_Cookie SHALL ter a flag Secure definida como true (apenas em HTTPS)
4. THE HTTP_Only_Cookie SHALL ter a flag SameSite definida como "Strict"
5. THE HTTP_Only_Cookie SHALL ter um tempo de expiração de 30 dias
6. THE Frontend_Component SHALL NÃO tentar acessar o session_id via JavaScript (document.cookie)

### Requisito 15: Simplificação da Tabela Users

**User Story:** Como desenvolvedor, quero simplificar a tabela users removendo campos desnecessários, para que o banco de dados seja mais limpo.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover os campos: password_hash, email_verified, password_reset_token, email_verification_token, login_attempts
2. THE Backend_Service SHALL manter os campos: id, google_id, google_email, google_name, google_picture, created_at, updated_at
3. THE Backend_Service SHALL adicionar um índice único em google_id
4. THE Backend_Service SHALL adicionar um índice em google_email para buscas rápidas
5. WHEN a migração é executada, THE Backend_Service SHALL preservar os dados existentes dos usuários que já fizeram login com Google

### Requisito 16: Remoção de Tabelas Desnecessárias

**User Story:** Como desenvolvedor, quero remover tabelas desnecessárias, para que o banco de dados seja mais simples.

#### Critérios de Aceitação

1. THE Backend_Service SHALL remover a tabela password_reset_tokens
2. THE Backend_Service SHALL remover a tabela email_verification_tokens
3. THE Backend_Service SHALL remover a tabela login_attempts
4. THE Backend_Service SHALL manter as tabelas: users, sessions, audit_logs
5. WHEN as tabelas são removidas, THE Backend_Service SHALL garantir que nenhuma referência a essas tabelas permaneça no código

### Requisito 17: Manutenção de Tabelas Essenciais

**User Story:** Como desenvolvedor, quero manter as tabelas essenciais, para que o sistema funcione corretamente.

#### Critérios de Aceitação

1. THE Backend_Service SHALL manter a tabela users com os campos: id, google_id, google_email, google_name, google_picture, created_at, updated_at
2. THE Backend_Service SHALL manter a tabela sessions com os campos: id, user_id, session_id, created_at, expires_at
3. THE Backend_Service SHALL manter a tabela audit_logs com os campos: id, user_id, evento, timestamp, ip_address, user_agent
4. THE Backend_Service SHALL garantir que todas as tabelas tenham índices apropriados para performance

### Requisito 18: Remoção de Componentes Frontend Desnecessários

**User Story:** Como desenvolvedor, quero remover componentes frontend desnecessários, para que o código seja mais limpo.

#### Critérios de Aceitação

1. THE Frontend_Component SHALL remover o componente RegisterForm
2. THE Frontend_Component SHALL remover o componente LoginForm
3. THE Frontend_Component SHALL remover o componente ForgotPasswordForm
4. THE Frontend_Component SHALL remover o componente ResetPasswordForm
5. WHEN os componentes são removidos, THE Frontend_Component SHALL garantir que nenhuma referência a esses componentes permaneça no código

### Requisito 19: Manutenção de Componentes Frontend Essenciais

**User Story:** Como desenvolvedor, quero manter os componentes frontend essenciais, para que a interface funcione corretamente.

#### Critérios de Aceitação

1. THE Frontend_Component SHALL manter o componente Dashboard
2. THE Frontend_Component SHALL manter o hook useAuth
3. THE Frontend_Component SHALL adicionar o componente GoogleLoginButton
4. THE Frontend_Component SHALL adicionar o componente GoogleLogoutButton
5. WHEN os componentes são mantidos, THE Frontend_Component SHALL garantir que eles funcionem corretamente com o novo sistema de autenticação

### Requisito 20: Componente GoogleLoginButton

**User Story:** Como usuário, quero clicar em um botão "Login com Google", para que eu possa fazer login de forma rápida.

#### Critérios de Aceitação

1. THE GoogleLoginButton SHALL exibir um botão com o texto "Login com Google"
2. WHEN o usuário clica no botão, THE GoogleLoginButton SHALL redirecionar para a URL de autorização do Google
3. THE GoogleLoginButton SHALL incluir o client_id, redirect_uri, scope e state
4. THE GoogleLoginButton SHALL usar a biblioteca @react-oauth/google para gerenciar o fluxo OAuth
5. WHEN o login é bem-sucedido, THE GoogleLoginButton SHALL redirecionar para o dashboard

### Requisito 21: Componente GoogleLogoutButton

**User Story:** Como usuário autenticado, quero clicar em um botão "Logout", para que eu possa encerrar minha sessão.

#### Critérios de Aceitação

1. THE GoogleLogoutButton SHALL exibir um botão com o texto "Logout"
2. WHEN o usuário clica no botão, THE GoogleLogoutButton SHALL fazer uma requisição POST para /api/auth/logout
3. WHEN o logout é bem-sucedido, THE GoogleLogoutButton SHALL redirecionar para a página de login
4. WHEN o logout falha, THE GoogleLogoutButton SHALL exibir uma mensagem de erro

### Requisito 22: Hook useAuth

**User Story:** Como desenvolvedor, quero usar um hook useAuth, para que eu possa acessar os dados do usuário autenticado em qualquer componente.

#### Critérios de Aceitação

1. THE useAuth SHALL retornar um objeto com: user, isAuthenticated, isLoading, logout
2. WHEN o componente é montado, THE useAuth SHALL fazer uma requisição para /api/auth/me para obter os dados do usuário
3. IF o usuário está autenticado, THEN THE useAuth SHALL retornar os dados do usuário
4. IF o usuário não está autenticado, THEN THE useAuth SHALL retornar null
5. WHEN o usuário faz logout, THE useAuth SHALL atualizar o estado para isAuthenticated = false

### Requisito 23: Rota GET /api/auth/me

**User Story:** Como desenvolvedor, quero uma rota que retorne os dados do usuário autenticado, para que eu possa obter as informações do usuário.

#### Critérios de Aceitação

1. WHEN uma requisição GET é feita para /api/auth/me, THE Backend_Service SHALL validar o session_id do cookie
2. IF o session_id for válido, THEN THE Backend_Service SHALL retornar os dados do usuário: id, google_email, google_name, google_picture
3. IF o session_id for inválido ou ausente, THEN THE Backend_Service SHALL retornar erro 401 Unauthorized
4. THE Backend_Service SHALL retornar os dados em formato JSON

### Requisito 24: Rota POST /api/auth/logout

**User Story:** Como desenvolvedor, quero uma rota de logout, para que eu possa remover a sessão do usuário.

#### Critérios de Aceitação

1. WHEN uma requisição POST é feita para /api/auth/logout, THE Backend_Service SHALL validar o session_id do cookie
2. IF o session_id for válido, THEN THE Backend_Service SHALL remover a sessão do banco de dados
3. WHEN a sessão é removida, THE Backend_Service SHALL limpar o HTTP_Only_Cookie
4. WHEN o logout é realizado, THE Audit_Log SHALL registrar um evento de "logout"
5. THE Backend_Service SHALL retornar um status 200 OK

### Requisito 25: Rota POST /api/auth/google/callback

**User Story:** Como desenvolvedor, quero uma rota de callback do Google, para que eu possa processar a resposta do Google OAuth.

#### Critérios de Aceitação

1. WHEN uma requisição POST é feita para /api/auth/google/callback com um código de autorização, THE Backend_Service SHALL trocar o código por um token de acesso
2. WHEN o token de acesso é obtido, THE Backend_Service SHALL validar o token com os servidores do Google
3. IF o token for válido, THEN THE Backend_Service SHALL extrair os dados do usuário
4. WHEN os dados do usuário são extraídos, THE Backend_Service SHALL verificar se o usuário existe no banco de dados
5. IF o usuário não existe, THEN THE Backend_Service SHALL criar um novo registro
6. WHEN o usuário é verificado ou criado, THE Backend_Service SHALL criar uma nova sessão
7. WHEN a sessão é criada, THE Backend_Service SHALL enviar um HTTP_Only_Cookie com o session_id
8. THE Backend_Service SHALL redirecionar para /dashboard

