# Massage Directory

Massage Directory is a Next.js App Router project for browsing massage shops, handling basic auth flows, and operating admin/community screens.

## Current implementation snapshot

This repository is in a **hybrid migration state**:

- **Prisma + PostgreSQL backed**
  - public shop list/detail APIs
  - auth register/login/logout/me flows
  - owner approval read/update flows
  - shop visibility / premium flag persistence
- **Still in-memory / seed-backed**
  - admin dashboard summary
  - notices
  - Q&A
  - review board
  - some admin shop editing flows

The main “backend integration” work now is finishing the migration from the in-memory `communityStore` layer to Prisma-backed storage everywhere.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL
- ESLint

## Project structure

```text
src/
  app/
    api/                  # Route handlers
    admin/                # Admin UI
    auth/                 # Login and registration pages
    board/                # Notice / Q&A / review pages
    shop/                 # Shop detail page
  components/             # Shared UI components
  lib/
    auth/                 # Session/auth helpers
    db/                   # Prisma client
    server/               # Server-side stores and data mapping
prisma/
  schema.prisma
  seed.ts
docs/
  backend-integration-plan.md
  backend-integration-plan.ko.md
```

## Important server modules

- `src/lib/server/shop-store.ts`
  - Prisma-backed shop listing/detail and admin visibility/premium updates
- `src/lib/server/auth-store.ts`
  - Prisma-backed registration, login, session lookup, owner approval handling
- `src/lib/server/communityStore.ts`
  - transitional in-memory store for notices, Q&A, reviews, dashboard data
- `src/lib/server/sample-data.ts`
  - seed-like sample data used by the in-memory community store

## Getting started

Install dependencies:

```bash
npm install
```

Create environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public
SESSION_SECRET=replace-with-a-long-random-secret
```

Run Prisma validation / generate / seed as needed:

```bash
npm run prisma:validate
npx prisma generate
npx prisma db push
npx prisma db seed
```

Start the dev server:

```bash
npm run dev
```

## Seed credentials

The Prisma seed currently provisions:

- `admin@massage.local` / `admin1234`
- `owner@massage.local` / `owner1234`
- `user@massage.local` / `user1234`

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:validate`

## Verification commands

Useful local verification commands:

```bash
npx tsc --noEmit
npm run lint
npm run prisma:validate
npm run build
```

## Known gaps

- No dedicated automated test suite is configured yet
- Community/admin board data still uses the in-memory `communityStore`
- `src/lib/mockData.ts` is legacy data and should not be treated as the current runtime source of truth
- `SESSION_SECRET` still has a development fallback and should be required in production

## Documentation

- Backend integration plan: [docs/backend-integration-plan.md](docs/backend-integration-plan.md)
- 백엔드 연동 계획서: [docs/backend-integration-plan.ko.md](docs/backend-integration-plan.ko.md)

