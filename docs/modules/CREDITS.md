# Module: Credits

## Description

Billing system based on credits with complete resource metering.

## Features

- Credit balance per user
- Automatic deduction per action
- Log of all transactions
- Infrastructure metering (bandwidth, disk, cache)

## Files

- `src/lib/credits/index.ts` - Main logic
- `src/lib/metering/index.ts` - Metering engine
- `src/app/api/platform/credits/route.ts` - API endpoints

## Main Functions

```typescript
deductCredits(userId, action, quantity, metadata)
meterInfrastructure(userId, resource, amount, metadata)
```

## Tables

- `profiles.credits_balance` - Current balance
- `credit_transactions` - Financial history
- `metering_logs` - Infrastructure consumption logs

## Status: 🟢 IMPLEMENTED

See `src/lib/credits/index.ts` for implementation.
