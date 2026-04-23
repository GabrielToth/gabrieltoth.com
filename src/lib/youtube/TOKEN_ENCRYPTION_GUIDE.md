# Token Encryption Service Guide

## Overview

The Token Encryption Service provides secure AES-256-GCM encryption and decryption for OAuth tokens. It supports multiple key management strategies and is designed to protect sensitive OAuth credentials stored in the database.

## Features

- **AES-256-GCM Encryption**: Industry-standard encryption algorithm with authentication
- **Multiple Key Management Strategies**:
  - Environment variable (default)
  - Local key file
  - AWS KMS (placeholder for future implementation)
- **Key Caching**: Efficient key retrieval with caching
- **Key Rotation**: Support for rotating encryption keys
- **Comprehensive Error Handling**: Detailed error messages for debugging
- **Type-Safe**: Full TypeScript support with proper types

## Installation

The service is already integrated into the project. Import it from `src/lib/youtube`:

```typescript
import {
    TokenEncryptionService,
    generateEncryptionKey,
    validateEncryptionKey,
    getTokenEncryptionService,
} from "@/lib/youtube"
```

## Quick Start

### Using the Singleton Instance

```typescript
import { getTokenEncryptionService } from "@/lib/youtube"

// Get the singleton instance
const encryptionService = getTokenEncryptionService()

// Encrypt a token
const encrypted = await encryptionService.encrypt("ya29.a0AfH6SMBx...")
console.log(encrypted.encryptedToken) // base64 encoded encrypted token

// Decrypt a token
const decrypted = await encryptionService.decrypt(encrypted.encryptedToken)
console.log(decrypted.token) // original token
```

### Creating a Custom Instance

```typescript
import { TokenEncryptionService } from "@/lib/youtube"

const service = new TokenEncryptionService({
    strategy: "environment",
    environmentVariableName: "MY_ENCRYPTION_KEY",
})

const encrypted = await service.encrypt("token")
const decrypted = await service.decrypt(encrypted.encryptedToken)
```

## Key Management Strategies

### 1. Environment Variable (Default)

Store the encryption key in an environment variable:

```bash
# Generate a key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in .env.local
TOKEN_ENCRYPTION_KEY=a1b2c3d4e5f6...
```

Configuration:

```typescript
const service = new TokenEncryptionService({
    strategy: "environment",
    environmentVariableName: "TOKEN_ENCRYPTION_KEY",
})
```

### 2. Local Key File

Store the encryption key in a local file:

```bash
# Generate and save key to file
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > /path/to/encryption.key

# Set permissions (Unix/Linux/Mac)
chmod 600 /path/to/encryption.key
```

Configuration:

```typescript
const service = new TokenEncryptionService({
    strategy: "local-file",
    localKeyPath: "/path/to/encryption.key",
})
```

### 3. AWS KMS (Future Implementation)

For production environments, AWS KMS provides secure key management:

```typescript
const service = new TokenEncryptionService({
    strategy: "aws-kms",
    kmsKeyId: "arn:aws:kms:region:account:key/key-id",
})
```

## API Reference

### TokenEncryptionService

#### Constructor

```typescript
constructor(config: KeyManagementConfig)
```

**Parameters:**
- `config.strategy`: Key management strategy ("environment" | "local-file" | "aws-kms")
- `config.environmentVariableName`: (for environment strategy) Name of environment variable
- `config.localKeyPath`: (for local-file strategy) Path to key file
- `config.kmsKeyId`: (for aws-kms strategy) AWS KMS key ID

#### encrypt(token: string): Promise<EncryptionResult>

Encrypts an OAuth token.

**Parameters:**
- `token`: The OAuth token to encrypt

**Returns:**
```typescript
{
    encryptedToken: string,      // base64 encoded encrypted token
    algorithm: string,            // "aes-256-gcm"
    encryptedAt: Date            // timestamp
}
```

**Example:**
```typescript
const result = await service.encrypt("ya29.a0AfH6SMBx...")
// result.encryptedToken: "AgIBAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0tMTU1OT1BRUlNTVFVWV1hZWltcXV5fYGFiY2RlZmduaGlqa2tsbW1ubm9vcHFyc3N0dXZ3eHl6e3t8fX5/gIGCg4OEhYWGh4eIiIiJiYmKioqLi4uMjIyMjY2Njo6Oj4+PkJCQkJCQkZGRkZGRkpKSkpKSkpKTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk9"
}
```

#### decrypt(encryptedToken: string): Promise<DecryptionResult>

Decrypts an encrypted OAuth token.

**Parameters:**
- `encryptedToken`: The encrypted token in base64 format

**Returns:**
```typescript
{
    token: string,               // original OAuth token
    decryptedAt: Date           // timestamp
}
```

**Example:**
```typescript
const result = await service.decrypt(encryptedToken)
// result.token: "ya29.a0AfH6SMBx..."
```

#### rotateKey(newKey: string): void

Rotates the encryption key. The new key must be a 64-character hex string (32 bytes).

**Parameters:**
- `newKey`: New encryption key as hex string

**Example:**
```typescript
const newKey = generateEncryptionKey()
service.rotateKey(newKey)
```

#### clearKeyCache(): void

Clears the cached encryption key. Useful for testing or when key needs to be reloaded.

**Example:**
```typescript
service.clearKeyCache()
```

### Utility Functions

#### generateEncryptionKey(): string

Generates a cryptographically secure encryption key.

**Returns:** 64-character hex string (32 bytes)

**Example:**
```typescript
const key = generateEncryptionKey()
// "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"
```

#### validateEncryptionKey(key: string): { isValid: boolean; error?: string }

Validates an encryption key format.

**Parameters:**
- `key`: Key to validate

**Returns:** Object with `isValid` boolean and optional `error` message

**Example:**
```typescript
const result = validateEncryptionKey("a1b2c3d4...")
if (result.isValid) {
    console.log("Key is valid")
} else {
    console.log("Error:", result.error)
}
```

#### getTokenEncryptionService(): TokenEncryptionService

Gets or creates the singleton instance of TokenEncryptionService.

**Returns:** TokenEncryptionService instance

**Example:**
```typescript
const service = getTokenEncryptionService()
```

## Environment Configuration

### Development (.env.local)

```bash
# Token Encryption Configuration
TOKEN_ENCRYPTION_STRATEGY=environment
TOKEN_ENCRYPTION_KEY_ENV_VAR=TOKEN_ENCRYPTION_KEY
TOKEN_ENCRYPTION_KEY=<64-character-hex-string>
```

### Production

For production, use AWS KMS:

```bash
TOKEN_ENCRYPTION_STRATEGY=aws-kms
AWS_KMS_KEY_ID=arn:aws:kms:region:account:key/key-id
```

## Security Considerations

### Key Management

1. **Never commit keys to version control**: Use environment variables or secure key management services
2. **Rotate keys regularly**: Use the `rotateKey()` method to rotate keys
3. **Use strong keys**: Always use `generateEncryptionKey()` to generate cryptographically secure keys
4. **Restrict key access**: Limit who can access encryption keys

### Encryption Algorithm

- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with 256-bit key and Galois/Counter Mode)
- **IV Length**: 12 bytes (96 bits) - randomly generated for each encryption
- **Auth Tag Length**: 16 bytes (128 bits) - provides authentication and integrity

### Token Storage

1. **Encrypted tokens** are stored in the database as base64 strings
2. **Original tokens** are never stored in plaintext
3. **Decryption** only happens when tokens are needed for API calls

## Error Handling

The service provides detailed error messages for debugging:

```typescript
try {
    const encrypted = await service.encrypt(token)
} catch (error) {
    console.error("Encryption failed:", error.message)
    // Handle error appropriately
}
```

Common errors:

- `"Token must be a non-empty string"` - Invalid token provided
- `"Environment variable X is not set"` - Missing environment variable
- `"Encryption key must be a valid hex string"` - Invalid key format
- `"Failed to decrypt token"` - Decryption failed (wrong key or tampered data)

## Testing

The service includes comprehensive tests:

```bash
# Run all tests
npm run test

# Run only token encryption tests
npm run test -- src/lib/youtube/token-encryption.test.ts

# Run with coverage
npm run test:coverage
```

## Performance

- **Encryption**: ~1-2ms per token
- **Decryption**: ~1-2ms per token
- **Key caching**: Subsequent operations use cached key (no I/O)

## Examples

### Storing an Encrypted Token in Database

```typescript
import { getTokenEncryptionService } from "@/lib/youtube"

const service = getTokenEncryptionService()

// Encrypt the token
const encrypted = await service.encrypt(oauthToken)

// Store in database
await db.youtube_channels.insert({
    user_id: userId,
    youtube_channel_id: channelId,
    access_token: encrypted.encryptedToken,
    token_expires_at: expiresAt,
})
```

### Retrieving and Decrypting a Token

```typescript
import { getTokenEncryptionService } from "@/lib/youtube"

const service = getTokenEncryptionService()

// Retrieve from database
const channel = await db.youtube_channels.findOne({ id: channelId })

// Decrypt the token
const decrypted = await service.decrypt(channel.access_token)

// Use the token for API calls
const youtubeApi = youtube.youtube({
    version: "v3",
    auth: decrypted.token,
})
```

### Rotating Keys

```typescript
import { generateEncryptionKey, getTokenEncryptionService } from "@/lib/youtube"

const service = getTokenEncryptionService()

// Generate new key
const newKey = generateEncryptionKey()

// Store new key in secure location (e.g., AWS KMS, environment variable)
process.env.TOKEN_ENCRYPTION_KEY = newKey

// Rotate the key
service.rotateKey(newKey)

// Note: Existing encrypted tokens will need to be re-encrypted with the new key
// This is typically done in a background job
```

## Troubleshooting

### "Environment variable X is not set"

**Solution**: Set the environment variable with a valid encryption key:

```bash
export TOKEN_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### "Encryption key must be a valid hex string"

**Solution**: Ensure the key is a 64-character hex string:

```bash
# Generate a valid key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Failed to decrypt token"

**Possible causes:**
1. Wrong encryption key
2. Encrypted token was tampered with
3. Encrypted token is corrupted

**Solution**: Verify the encryption key is correct and the encrypted token hasn't been modified.

## References

- [AES-256-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [OWASP Encryption Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Encryption_Cheat_Sheet.html)
