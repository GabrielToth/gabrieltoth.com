# Sistema de Créditos

## Visão Geral

O sistema de créditos é a base de monetização da plataforma. Cada ação tem um custo em créditos.

## Conversão

```
1 Crédito = R$ 0.0001
100.000 Créditos = R$ 10.00
```

## Planos de Assinatura

| Plano      | Créditos/Mês | Preço  |
| ---------- | ------------ | ------ |
| Básico     | 100.000      | R$ 10  |
| Pro        | 500.000      | R$ 50  |
| Enterprise | 2.000.000    | R$ 200 |

## Custos por Ação

### Módulo Chat

| Ação              | Créditos |
| ----------------- | -------- |
| Mensagem recebida | 1        |
| Timeout           | 10       |
| Ban               | 25       |
| Unban             | 5        |

### Módulo YouTube

| Ação                           | Créditos |
| ------------------------------ | -------- |
| Download (por minuto de vídeo) | 100      |
| Agendar post                   | 50       |
| Rewrite IA (por 1k tokens)     | 500      |

### Infraestrutura

| Recurso              | Créditos |
| -------------------- | -------- |
| Banda (por GB)       | 5.000    |
| Storage (por GB/mês) | 1.000    |
| Cache (por 1k ops)   | 50       |
| API (por 1k req)     | 100      |

## Arquivos Relevantes

- `src/lib/credits/index.ts` - Lógica de dedução
- `src/lib/metering/index.ts` - Metrificação de infra
- `src/lib/db/schema.sql` - Tabelas de créditos
