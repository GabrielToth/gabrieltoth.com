# Módulo: Streaming

## Descrição

Sistema de restream com validação de qualidade e billing por uso real.

## Funcionalidades

- Ingest RTMP
- Restream para múltiplas plataformas
- Validação de specs (resolução, bitrate, fps)
- Billing por minuto de stream

## Arquivos

- `src/app/api/platform/stream/route.ts` - API endpoints

## Custo Base

- 1080p30: 1.000 créditos/minuto

## Multiplicadores

| Qualidade | Multiplicador |
| --------- | ------------- |
| 720p30    | 0.5x          |
| 1080p30   | 1.0x          |
| 1080p60   | 1.5x          |
| 1440p60   | 2.5x          |
| 4K60      | 5.0x          |

## Validação de Specs

Se o usuário enviar qualidade maior que configurada:

- Stream é cancelado
- Multa de 20% aplicada

## Backend Sugerido

- Cloudflare Stream ou AWS IVS

## Status: 🔴 NÃO IMPLEMENTADO

Próximo passo: v0.7.0
