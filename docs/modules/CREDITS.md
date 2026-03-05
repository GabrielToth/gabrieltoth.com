# Módulo: Créditos

## Descrição

Sistema de billing baseado em créditos com metrificação total de recursos.

## Funcionalidades

- Saldo de créditos por usuário
- Dedução automática por ação
- Log de todas transações
- Metrificação de infra (banda, disco, cache)

## Arquivos

- `src/lib/credits/index.ts` - Lógica principal
- `src/lib/metering/index.ts` - Engine de metrificação
- `src/app/api/platform/credits/route.ts` - API endpoints

## Funções Principais

```typescript
deductCredits(userId, action, quantity, metadata)
meterInfrastructure(userId, resource, amount, metadata)
```

## Tabelas

- `profiles.credits_balance` - Saldo atual
- `credit_transactions` - Histórico financeiro
- `metering_logs` - Logs de consumo de infra

## Status: 🟢 IMPLEMENTADO

Ver `src/lib/credits/index.ts` para a implementação.
