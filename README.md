# Massage Directory

Massage Directory is a Next.js App Router project for browsing massage shops, handling basic auth flows, and operating admin/community screens.

## Current implementation snapshot

This repository is now in a **Prisma-first migration state**.

- **Prisma + PostgreSQL backed**
  - public shop list/detail APIs
  - auth register/login/logout/me flows
  - owner approval read/update flows
  - shop visibility / premium flag persistence
  - notices
  - Q&A
  - review board
  - admin dashboard summary
  - admin shop edit/create flows

The current backend work is focused on hardening authorization, persistence coverage, and operational verification around that Prisma-backed path.

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
  - Prisma-backed notices, Q&A, reviews, dashboard data, and admin shop editing flows
- `src/lib/server/admin-shop-access.ts`
  - owner/admin normalization helper for admin shop write routes

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
- `npm run test`
- `npm run typecheck`
- `npm run verify`
- `npm run lint`
- `npm run prisma:validate`

## Verification commands

Useful local verification commands:

```bash
npm run typecheck
npm test
npm run lint
npm run prisma:validate
npm run build
npm run verify
```

## Throughput note

For roughly **1,000 visits per day**, the current Next.js + Prisma + PostgreSQL shape is comfortably within the expected operating range for a normal single-instance deployment, assuming a healthy Postgres database and a standard app server process.

Recent hardening added:

- Prisma-backed community/admin persistence
- owner/admin authorization guards on mutation paths
- dependency-free regression tests and a repeatable `verify` script
- schema indexes for the common list/count/order query patterns

## Known gaps

- Browser-driven admin/owner session flows are not covered by a full end-to-end UI suite yet
- `src/lib/mockData.ts` is legacy data and should not be treated as the current runtime source of truth
- `SESSION_SECRET` still has a development fallback and should be required in production

## Documentation

- Backend integration plan: [docs/backend-integration-plan.md](docs/backend-integration-plan.md)
- Korean backend integration plan: [docs/backend-integration-plan.ko.md](docs/backend-integration-plan.ko.md)
