# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│                     gabrieltoth.com                     │
├─────────────────────────────────────────────────────────┤
│                      API ROUTES                         │
│   /api/platform/*  │  /api/health  │  /api/webhooks    │
├─────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC                        │
│  Credits  │  Metering  │  Auth  │  Platform Adapters   │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                           │
│      PostgreSQL     │     Redis     │     S3/R2        │
└─────────────────────────────────────────────────────────┘
```

## Stack

| Layer    | Technology                         |
| -------- | ---------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| API      | Next.js API Routes                 |
| Auth     | Auth.js (NextAuth)                 |
| Database | PostgreSQL (node-postgres)         |
| Cache    | Redis                              |
| Storage  | S3-compatible (MinIO/R2)           |
| Payments | Stripe                             |

## Principles

1. **Total Metering**: Every resource (bandwidth, disk, cache) is measured and charged
2. **Self-Hosted First**: Functional Docker Compose for production
3. **Transparency**: Users see exactly where they spend credits
4. **Modularity**: Each module is independent

## Typical Data Flow

```
User → API Route → Validation → Business Logic
                                        ↓
                               Check Credits
                                        ↓
                               Execute Action
                                        ↓
                               Log Metering
                                        ↓
                               Deduct Credits
                                        ↓
                               Return Response
```
