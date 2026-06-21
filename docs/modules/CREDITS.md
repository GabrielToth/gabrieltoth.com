# Module: Credits

## Description

Billing system based on credits with complete resource metering and transaction history.

## Features

- Credit balance per user (`user_accounts.balance`)
- Automatic deduction per action (video upload, AI chat, email, etc.)
- Admin grant for testing (via CREDIT_ADMIN_IDS env var whitelist)
- Full transaction history
- Read-only public cost table

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/credits/balance` | GET | Session | Get current balance |
| `/api/credits/transactions` | GET | Session | Get transaction history |
| `/api/credits/costs` | GET | Public | Get credit cost table |
| `/api/credits/grant` | POST | Session + Admin | Grant free credits |
| `/api/credits/whoami` | GET | Session | Get user info + admin status |

## Files

- `src/lib/credits/service.ts` - Unified credit service (deduct, grant, balance, transactions)
- `src/lib/credits/session.ts` - Session user lookup, admin whitelist via CREDIT_ADMIN_IDS env var
- `src/app/api/credits/*/route.ts` - API endpoints
- `src/components/credits/CreditWidget.tsx` - Balance + recent transactions UI
- `src/app/dashboard/credits/page.tsx` - Full credits page with admin grant form

## Main Functions

```typescript
getBalance(userId: string): Promise<{ balance: number }>
deductAction(userId: string, action: CreditAction, quantity?: number): Promise<DeductResult>
adminGrant(userId: string, amount: number, reason?: string): Promise<AdminGrantResult>
getTransactions(userId: string, limit?: number): Promise<TransactionData[]>
```

## Environment Variables

- `CREDIT_ADMIN_IDS` - Comma-separated list of UUIDs allowed to use the admin grant endpoint

## Tables

- `user_accounts.balance` - Current balance per user
- `transactions` - Financial history (debits and credits)

## Status: 🟢 IMPLEMENTED
