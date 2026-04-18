# Design Técnico - OAuth Google Authentication

## Overview

Este documento descreve a arquitetura técnica para um sistema de autenticação simplificado baseado exclusivamente em Google OAuth. O sistema remove toda a complexidade de autenticação com formulário (email/senha), confirmação de email, reset de senha e recuperação de conta, substituindo-os por um fluxo único e direto de login via Google OAuth.

### Objetivos de Design

- Simplificar o fluxo de autenticação removendo formulários e emails
- Implementar segurança robusta com validação de tokens Google
- Manter sessões seguras com HTTP-Only cookies
- Registrar eventos de segurança em audit logs
- Fornecer uma experiência de usuário fluida e intuitiva

### Escopo

- Login com Google OAuth
- Registro automático na primeira autenticação
- Manutenção de sessão
- Logout seguro
- Dashboard protegido
- Audit logging
- Remoção de componentes desnecessários

---

## Architecture

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ GoogleLoginBtn   │  │ GoogleLogoutBtn  │  │  Dashboard   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              useAuth Hook (Context)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTP/HTTPS │ (with cookies)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Authentication Middleware                   │  │
│  │  - Validar session_id do cookie                         │  │
│  │  - Verificar expiração da sessão                        │  │
│  │  - Proteger rotas                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Auth Routes                                 │  │
│  │  - POST /api/auth/google/callback                       │  │
│  │  - GET /api/auth/me                                     │  │
│  │  - POST /api/auth/logout                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Auth Service                                │  │
│  │  - Validar token Google                                 │  │
│  │  - Criar/atualizar usuário                              │  │
│  │  - Gerenciar sessões                                    │  │
│  │  - Registrar audit logs                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    Database  │
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    users     │  │   sessions   │  │   audit_logs         │  │
│  │              │  │              │  │                      │  │
│  │ - id         │  │ - id         │  │ - id                 │  │
│  │ - google_id  │  │ - user_id    │  │ - user_id            │  │
│  │ - google_... │  │ - session_id │  │ - evento             │  │
│  │ - created_at │  │ - expires_at │  │ - timestamp          │  │
│  │ - updated_at │  │              │  │ - ip_address         │  │
│  │              │  │              │  │ - user_agent         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    Google    │ OAuth API
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Google OAuth Service                         │
│  - Autorização de usuário                                       │
│  - Validação de tokens                                          │
│  - Extração de dados do usuário                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       │ 1. Clica em "Login com Google"
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: GoogleLoginButton                                  │
│ - Redireciona para Google OAuth                              │
│ - Inclui: client_id, redirect_uri, scope, state             │
└──────────────────────────────────────────────────────────────┘
       │
       │ 2. Redireciona para Google
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Google OAuth                                                 │
│ - Exibe página de consentimento                              │
│ - Usuário autoriza acesso                                    │
│ - Retorna código de autorização                              │
└──────────────────────────────────────────────────────────────┘
       │
       │ 3. Redireciona para callback com código
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Callback Handler                                   │
│ - Extrai código da URL                                       │
│ - Envia código para backend                                  │
└──────────────────────────────────────────────────────────────┘
       │
       │ 4. POST /api/auth/google/callback
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: Auth Service                                        │
│ - Troca código por token de acesso                           │
│ - Valida token com Google                                    │
│ - Extrai dados do usuário (email, nome, foto, google_id)    │
│ - Verifica se usuário existe                                 │
│ - Se não existe: cria novo usuário                           │
│ - Se existe: atualiza dados (nome, foto)                     │
│ - Cria nova sessão                                           │
│ - Registra evento em audit_logs                              │
│ - Envia HTTP-Only cookie com session_id                      │
└──────────────────────────────────────────────────────────────┘
       │
       │ 5. Redireciona para /dashboard
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Dashboard                                          │
│ - Valida autenticação via useAuth hook                       │
│ - Exibe dados do usuário                                     │
│ - Exibe botão de logout                                      │
└──────────────────────────────────────────────────────────────┘
```

### Fluxo de Logout

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário clica em "Logout"                                   │
└──────────────────────────────────────────────────────────────┘
       │
       │ 1. POST /api/auth/logout
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: Auth Service                                        │
│ - Valida session_id do cookie                                │
│ - Remove sessão do banco de dados                            │
│ - Limpa HTTP-Only cookie                                     │
│ - Registra evento em audit_logs                              │
│ - Retorna 200 OK                                             │
└──────────────────────────────────────────────────────────────┘
       │
       │ 2. Redireciona para /auth/login
       ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Login Page                                         │
│ - Exibe GoogleLoginButton                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Backend Components

#### 1. Auth Service (`src/services/auth.service.ts`)

Responsável por toda a lógica de autenticação.

```typescript
interface AuthService {
  // Validar token do Google
  validateGoogleToken(token: string): Promise<GoogleTokenPayload>
  
  // Criar ou atualizar usuário
  upsertUser(googleData: GoogleUserData): Promise<User>
  
  // Criar sessão
  createSession(userId: string): Promise<Session>
  
  // Validar sessão
  validateSession(sessionId: string): Promise<Session | null>
  
  // Remover sessão
  removeSession(sessionId: string): Promise<void>
  
  // Registrar evento de audit
  logAuditEvent(event: AuditEvent): Promise<void>
}
```

#### 2. Auth Routes (`src/routes/auth.routes.ts`)

Define as rotas de autenticação.

```typescript
// POST /api/auth/google/callback
// Body: { code: string }
// Response: { redirectUrl: string }

// GET /api/auth/me
// Response: { id, google_email, google_name, google_picture }

// POST /api/auth/logout
// Response: { success: boolean }
```

#### 3. Auth Middleware (`src/middleware/auth.middleware.ts`)

Middleware para proteger rotas.

```typescript
interface AuthMiddleware {
  // Validar autenticação
  authenticate(req, res, next): void
  
  // Validar CSRF token
  validateCsrf(req, res, next): void
}
```

### Frontend Components

#### 1. GoogleLoginButton

Componente para iniciar o fluxo de login.

```typescript
interface GoogleLoginButtonProps {
  onSuccess?: (response: GoogleLoginResponse) => void
  onError?: (error: Error) => void
  className?: string
}

// Uso:
<GoogleLoginButton 
  onSuccess={(response) => {
    // Enviar código para backend
    // Redirecionar para dashboard
  }}
/>
```

#### 2. GoogleLogoutButton

Componente para fazer logout.

```typescript
interface GoogleLogoutButtonProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
}

// Uso:
<GoogleLogoutButton 
  onSuccess={() => {
    // Redirecionar para login
  }}
/>
```

#### 3. Dashboard

Página protegida com dados do usuário.

```typescript
interface DashboardProps {
  // Sem props - usa useAuth hook
}

// Uso:
<Dashboard />
```

#### 4. useAuth Hook

Hook para acessar dados do usuário autenticado.

```typescript
interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

// Uso:
const { user, isAuthenticated, isLoading, logout } = useAuth()
```

---

## Data Models

### Database Schema

#### Tabela: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  google_email VARCHAR(255) NOT NULL,
  google_name VARCHAR(255) NOT NULL,
  google_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_google_email ON users(google_email);
```

#### Tabela: sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

#### Tabela: audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  evento VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_evento ON audit_logs(evento);
```

### TypeScript Interfaces

```typescript
// User
interface User {
  id: string
  google_id: string
  google_email: string
  google_name: string
  google_picture?: string
  created_at: Date
  updated_at: Date
}

// Session
interface Session {
  id: string
  user_id: string
  session_id: string
  created_at: Date
  expires_at: Date
}

// AuditLog
interface AuditLog {
  id: string
  user_id?: string
  evento: 'login' | 'logout' | 'login_failed' | 'user_created'
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

// Google OAuth
interface GoogleTokenPayload {
  sub: string // google_id
  email: string
  name: string
  picture?: string
  aud: string
  iss: string
  exp: number
  iat: number
}

interface GoogleUserData {
  google_id: string
  google_email: string
  google_name: string
  google_picture?: string
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Google Token Validation

*For any* valid Google token, the system SHALL successfully validate it and extract the user's information (google_id, email, name, picture).

**Validates: Requirements 11.1, 11.3**

### Property 2: User Creation on First Login

*For any* new Google user logging in for the first time, the system SHALL create a new user record with all required fields (google_id, google_email, google_name, google_picture).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: User Update on Subsequent Login

*For any* existing user logging in again, if their Google profile data (name or picture) has changed, the system SHALL update the user record with the new data.

**Validates: Requirements 2.5**

### Property 4: Session Creation and Validation

*For any* successful authentication, the system SHALL create a session with a unique session_id, store it in the database, and return it in an HTTP-Only cookie that can be validated on subsequent requests.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Session Expiration

*For any* session, if the current time exceeds the expires_at timestamp, the system SHALL reject the session and require re-authentication.

**Validates: Requirements 4.6, 4.7, 4.8**

### Property 6: Logout Removes Session

*For any* user performing logout, the system SHALL remove the session from the database and clear the HTTP-Only cookie, preventing further access with that session_id.

**Validates: Requirements 5.1, 5.2**

### Property 7: Audit Log Recording

*For any* authentication event (login success, login failure, logout), the system SHALL record an audit log entry with the event type, timestamp, user_id (if applicable), IP address, and user agent.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 8: HTTP-Only Cookie Security

*For any* session cookie created, the system SHALL set the HttpOnly, Secure, and SameSite=Strict flags to prevent JavaScript access and CSRF attacks.

**Validates: Requirements 14.2, 14.3, 14.4**

### Property 9: Invalid Token Rejection

*For any* invalid, expired, or revoked Google token, the system SHALL reject the authentication attempt and return an error without creating a session.

**Validates: Requirements 11.2**

### Property 10: Unique Google ID Constraint

*For any* user in the database, the google_id SHALL be unique, ensuring that each Google account is associated with exactly one user record.

**Validates: Requirements 3.4**

---

## Error Handling

### Authentication Errors

| Error | HTTP Status | Message | Action |
|-------|-------------|---------|--------|
| Invalid Google Token | 401 | "Invalid or expired Google token" | Redirect to login |
| Token Validation Failed | 401 | "Failed to validate token with Google" | Retry or redirect to login |
| Missing Authorization Code | 400 | "Authorization code is required" | Redirect to login |
| Session Not Found | 401 | "Session not found or expired" | Redirect to login |
| Invalid Session ID | 401 | "Invalid session ID" | Redirect to login |
| CSRF Token Invalid | 403 | "CSRF token validation failed" | Reject request |
| Missing CSRF Token | 403 | "CSRF token is required" | Reject request |

### Database Errors

| Error | HTTP Status | Message | Action |
|-------|-------------|---------|--------|
| User Creation Failed | 500 | "Failed to create user" | Log error, retry |
| Session Creation Failed | 500 | "Failed to create session" | Log error, retry |
| Audit Log Failed | 500 | "Failed to log audit event" | Log error, continue |
| Database Connection Error | 503 | "Database connection error" | Retry with backoff |

### Google OAuth Errors

| Error | HTTP Status | Message | Action |
|-------|-------------|---------|--------|
| Google API Error | 502 | "Google OAuth service error" | Retry or redirect to login |
| Network Error | 503 | "Network error communicating with Google" | Retry with backoff |
| Invalid Client ID | 500 | "Invalid Google client configuration" | Check configuration |

### Frontend Errors

| Error | Message | Action |
|-------|---------|--------|
| Logout Failed | "Failed to logout" | Show error message, retry |
| Fetch User Data Failed | "Failed to load user data" | Show error message, retry |
| Network Error | "Network error" | Show error message, retry |

---

## Testing Strategy

### Unit Tests

#### Auth Service Tests

- **Test**: Validate Google token with valid token
  - Input: Valid Google token
  - Expected: Returns GoogleTokenPayload with correct data
  
- **Test**: Validate Google token with invalid token
  - Input: Invalid/expired Google token
  - Expected: Throws authentication error
  
- **Test**: Create new user on first login
  - Input: New Google user data
  - Expected: User created with all fields
  
- **Test**: Update existing user on subsequent login
  - Input: Existing user with updated profile data
  - Expected: User record updated with new data
  
- **Test**: Create session with unique session_id
  - Input: User ID
  - Expected: Session created with unique session_id
  
- **Test**: Validate active session
  - Input: Valid session_id
  - Expected: Returns session data
  
- **Test**: Reject expired session
  - Input: Expired session_id
  - Expected: Returns null or throws error
  
- **Test**: Remove session on logout
  - Input: Session ID
  - Expected: Session deleted from database

#### Auth Routes Tests

- **Test**: POST /api/auth/google/callback with valid code
  - Input: Valid authorization code
  - Expected: 200 OK, HTTP-Only cookie set, redirect URL returned
  
- **Test**: POST /api/auth/google/callback with invalid code
  - Input: Invalid authorization code
  - Expected: 401 Unauthorized
  
- **Test**: GET /api/auth/me with valid session
  - Input: Valid session cookie
  - Expected: 200 OK, user data returned
  
- **Test**: GET /api/auth/me without session
  - Input: No session cookie
  - Expected: 401 Unauthorized
  
- **Test**: POST /api/auth/logout with valid session
  - Input: Valid session cookie
  - Expected: 200 OK, cookie cleared

#### Auth Middleware Tests

- **Test**: Authenticate with valid session
  - Input: Valid session cookie
  - Expected: Middleware allows request to proceed
  
- **Test**: Authenticate without session
  - Input: No session cookie
  - Expected: Middleware returns 401 Unauthorized
  
- **Test**: Validate CSRF token
  - Input: Valid CSRF token
  - Expected: Middleware allows request to proceed
  
- **Test**: Validate invalid CSRF token
  - Input: Invalid CSRF token
  - Expected: Middleware returns 403 Forbidden

### Integration Tests

- **Test**: Complete login flow
  - Steps: Click login → Google OAuth → Callback → Session created → Redirect to dashboard
  - Expected: User authenticated and dashboard accessible
  
- **Test**: Complete logout flow
  - Steps: Click logout → Session removed → Redirect to login
  - Expected: User not authenticated, login page displayed
  
- **Test**: Session persistence across requests
  - Steps: Login → Make multiple requests → Verify session valid
  - Expected: All requests authenticated successfully
  
- **Test**: Session expiration
  - Steps: Login → Wait for expiration → Make request
  - Expected: Request rejected with 401 Unauthorized

### Property-Based Tests

#### Property 1: Google Token Validation
```typescript
// Feature: oauth-google-authentication, Property 1: Google Token Validation
test('validates any valid Google token and extracts user info', () => {
  fc.assert(
    fc.property(fc.record({
      sub: fc.string(),
      email: fc.emailAddress(),
      name: fc.string(),
      picture: fc.webUrl(),
      aud: fc.string(),
      iss: fc.constant('https://accounts.google.com'),
      exp: fc.integer({ min: Date.now() / 1000 }),
      iat: fc.integer({ max: Date.now() / 1000 })
    }), (token) => {
      const result = validateGoogleToken(token)
      expect(result).toBeDefined()
      expect(result.google_id).toBe(token.sub)
      expect(result.google_email).toBe(token.email)
    })
  )
})
```

#### Property 2: User Creation on First Login
```typescript
// Feature: oauth-google-authentication, Property 2: User Creation on First Login
test('creates new user for any first-time Google login', () => {
  fc.assert(
    fc.property(fc.record({
      google_id: fc.string(),
      google_email: fc.emailAddress(),
      google_name: fc.string(),
      google_picture: fc.webUrl()
    }), async (userData) => {
      const user = await upsertUser(userData)
      expect(user).toBeDefined()
      expect(user.google_id).toBe(userData.google_id)
      expect(user.google_email).toBe(userData.google_email)
      expect(user.google_name).toBe(userData.google_name)
    })
  )
})
```

#### Property 3: Session Creation and Validation
```typescript
// Feature: oauth-google-authentication, Property 3: Session Creation and Validation
test('creates valid session for any authenticated user', () => {
  fc.assert(
    fc.property(fc.uuid(), async (userId) => {
      const session = await createSession(userId)
      expect(session).toBeDefined()
      expect(session.user_id).toBe(userId)
      expect(session.session_id).toBeTruthy()
      
      const validated = await validateSession(session.session_id)
      expect(validated).toBeDefined()
      expect(validated.user_id).toBe(userId)
    })
  )
})
```

#### Property 4: Session Expiration
```typescript
// Feature: oauth-google-authentication, Property 4: Session Expiration
test('rejects any expired session', () => {
  fc.assert(
    fc.property(fc.uuid(), async (userId) => {
      const session = await createSession(userId)
      // Simulate expiration
      await db.query('UPDATE sessions SET expires_at = NOW() - INTERVAL 1 DAY WHERE id = $1', [session.id])
      
      const validated = await validateSession(session.session_id)
      expect(validated).toBeNull()
    })
  )
})
```

#### Property 5: Audit Log Recording
```typescript
// Feature: oauth-google-authentication, Property 5: Audit Log Recording
test('records audit log for any authentication event', () => {
  fc.assert(
    fc.property(fc.record({
      user_id: fc.uuid(),
      evento: fc.constantFrom('login', 'logout', 'login_failed'),
      ip_address: fc.ipV4(),
      user_agent: fc.string()
    }), async (event) => {
      await logAuditEvent(event)
      
      const logged = await db.query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND evento = $2',
        [event.user_id, event.evento]
      )
      expect(logged.rows.length).toBeGreaterThan(0)
      expect(logged.rows[0].ip_address).toBe(event.ip_address)
    })
  )
})
```

#### Property 6: HTTP-Only Cookie Security
```typescript
// Feature: oauth-google-authentication, Property 6: HTTP-Only Cookie Security
test('sets secure flags on any session cookie', () => {
  fc.assert(
    fc.property(fc.uuid(), async (userId) => {
      const session = await createSession(userId)
      const cookie = createSessionCookie(session.session_id)
      
      expect(cookie.httpOnly).toBe(true)
      expect(cookie.secure).toBe(true)
      expect(cookie.sameSite).toBe('Strict')
    })
  )
})
```

#### Property 7: Invalid Token Rejection
```typescript
// Feature: oauth-google-authentication, Property 7: Invalid Token Rejection
test('rejects any invalid Google token', () => {
  fc.assert(
    fc.property(fc.string(), async (invalidToken) => {
      expect(() => validateGoogleToken(invalidToken)).toThrow()
    })
  )
})
```

#### Property 8: Unique Google ID Constraint
```typescript
// Feature: oauth-google-authentication, Property 8: Unique Google ID Constraint
test('enforces unique google_id for any user', () => {
  fc.assert(
    fc.property(fc.record({
      google_id: fc.string(),
      google_email: fc.emailAddress(),
      google_name: fc.string()
    }), async (userData) => {
      const user1 = await upsertUser(userData)
      
      expect(() => upsertUser({
        ...userData,
        google_email: 'different@example.com'
      })).toThrow()
    })
  )
})
```

---

## Security Considerations

### Token Validation

- Validar todos os tokens do Google com a Google Auth Library
- Verificar assinatura do token
- Verificar expiração do token
- Verificar audience (aud) do token
- Verificar issuer (iss) do token

### Session Management

- Gerar session_id com criptografia forte (crypto.randomBytes)
- Armazenar session_id em HTTP-Only cookie
- Definir expiração de 30 dias
- Validar session_id em todas as requisições protegidas
- Remover sessão ao fazer logout

### CSRF Protection

- Gerar CSRF token único para cada sessão
- Validar CSRF token em requisições POST/PUT/DELETE
- Usar biblioteca csrf para gerenciar tokens

### Audit Logging

- Registrar todos os eventos de login/logout
- Registrar IP address e user agent
- Manter logs por no mínimo 90 dias
- Usar timestamps UTC

### Input Validation

- Validar código de autorização do Google
- Validar session_id do cookie
- Validar CSRF token
- Sanitizar dados do usuário antes de armazenar

### HTTPS Only

- Forçar HTTPS em produção
- Definir Secure flag em cookies
- Usar HSTS headers

---

## Implementation Checklist

### Backend

- [ ] Criar tabelas: users, sessions, audit_logs
- [ ] Implementar Auth Service
- [ ] Implementar Auth Routes
- [ ] Implementar Auth Middleware
- [ ] Configurar Google OAuth credentials
- [ ] Implementar validação de token Google
- [ ] Implementar criação/atualização de usuário
- [ ] Implementar gerenciamento de sessão
- [ ] Implementar audit logging
- [ ] Implementar CSRF protection
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Adicionar testes property-based

### Frontend

- [ ] Criar componente GoogleLoginButton
- [ ] Criar componente GoogleLogoutButton
- [ ] Criar componente Dashboard
- [ ] Criar hook useAuth
- [ ] Implementar proteção de rotas
- [ ] Implementar tratamento de erros
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

### Database

- [ ] Criar migrations para tabelas
- [ ] Adicionar índices
- [ ] Configurar constraints
- [ ] Testar performance

### Deployment

- [ ] Configurar variáveis de ambiente
- [ ] Configurar Google OAuth credentials
- [ ] Testar em staging
- [ ] Deploy em produção
- [ ] Monitorar logs

---

## Próximos Passos

1. Revisar design com stakeholders
2. Implementar backend
3. Implementar frontend
4. Executar testes
5. Deploy em produção
