# Authentication Service

Argon2id-only password hashing and verification.

- New passwords: always Argon2id via `hashPasswordArgon2id`
- Login: `validatePassword` accepts Argon2id hashes only
- Pepper: `PEPPER_SECRET` (min 32 chars)
- Rate limiting and audit logging via Supabase

See `password-validator.ts` and `argon2id-hasher.ts`.
