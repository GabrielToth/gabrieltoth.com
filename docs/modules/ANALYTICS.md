# Módulo: Analytics

## Descrição

Dashboard de métricas agregadas de todas as plataformas vinculadas.

## Funcionalidades

- Visão unificada de todas plataformas
- Gráficos por dia (últimos 30 dias)
- Filtros por plataforma/canal
- Visão de consumo de créditos/infra

## Arquivos

- `src/app/api/platform/analytics/route.ts` - API endpoints

## Métricas Coletadas

| Plataforma | Métricas                 |
| ---------- | ------------------------ |
| YouTube    | Views, subs, watch time  |
| Twitch     | Viewers, followers, subs |
| TikTok     | Views, likes, shares     |

## Custo

- Acesso diário ao dashboard: 1.000 créditos

## Visões

1. **Criador**: Vê seu próprio consumo e métricas
2. **Admin**: Vê lucro/custo por usuário

## Status: 🟡 PARCIALMENTE IMPLEMENTADO

Endpoint básico criado. Falta: coleta de métricas externas.
