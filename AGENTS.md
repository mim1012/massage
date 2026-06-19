# Repository Guidelines

## Project Overview

This is `massage-directory`, a Korean Next.js App Router application for discovering massage/healing shops by region, theme, popularity, and directory filters. The app combines public shop browsing, auth, owner/admin workflows, board/Q&A/review features, analytics, and site settings.

## Architecture & Data Flow

- **App framework:** Next.js 16 App Router with React 19 and TypeScript. Route handlers live under `src/app/api/**`; pages live under `src/app/**/page.tsx`.
- **Public homepage flow:** `src/app/page.tsx` parses directory query params, applies canonical redirects, decides whether to defer initial shop loading, fetches shops via `src/lib/server/shop-store.ts`, fetches public content via `communityStore`, builds DTOs with `src/lib/public-page-data.ts`, then hydrates `HomePageClient`.
- **Backend flow:** API route handlers should stay thin: parse request, call auth/validation helpers, delegate persistence to `src/lib/server/**`, then return `Response.json(...)` or `errorResponse(error)`.
- **Data layer:** Prisma 7 + PostgreSQL via `@prisma/adapter-pg` and `pg` in `src/lib/db/prisma.ts`. The Prisma schema is the source of truth for persisted models: users, owners, shops, courses/images, reviews, Q&A/comments, notices, audit logs, partnerships, settings, themes, analytics.
- **Caching:** Public shop reads use module-level Promise caches plus Next `unstable_cache` tags; mutations must invalidate relevant caches (for shops, use `invalidatePublicShopListCache()`).
- **Auth:** Session cookie is `massage_session`. Middleware is only a coarse `/admin` redirect guard; real authorization belongs in server/API code through `requireUser`, `requireRole`, and `assertOwnershipOrAdmin`.
- **Transitional state:** Some flows are Prisma-backed, while legacy or partially migrated community/admin flows may still use `communityStore`, sample data, or `mockData`. Identify the backing store before changing behavior; do not treat `src/lib/mockData.ts` as authoritative.

## Key Directories

- `src/app/` — App Router pages, layouts, middleware targets, and API route handlers.
- `src/app/api/` — backend endpoints for shops, auth, admin, board, analytics, settings, themes.
- `src/components/` — public/admin/owner React components and shared layout UI.
- `src/lib/server/` — server-side stores, Prisma queries, data mapping, admin/community logic.
- `src/lib/db/` — Prisma client and PostgreSQL pool setup.
- `src/lib/auth/` — auth guards, session cookie/token utilities, password/session helpers, auth HTTP errors.
- `src/lib/security/` — security headers and in-memory rate limiting.
- `src/lib/client/` — browser-only helpers such as submission locks.
- `prisma/` — schema, migrations, and seed data.
- `tests/` — Node unit/route tests (`*.test.ts`) and Playwright specs (`*.spec.ts`, `tests/e2e/**`).
- `scripts/` — custom test runner, alias registration, Vercel build wrapper, seed helpers.
- `docs/` — backend integration and launch-readiness notes; useful context, but schema/code wins over stale docs.

## Development Commands

Use npm scripts from `package.json`:

```bash
npm run dev          # Next dev server, forced Webpack
npm run build        # scripts/vercel-build.mjs, then next build --webpack
npm start            # next start
npm test             # custom Node test runner for tests/**/*.test.ts
npm test -- tests/http.test.ts
npm run test:e2e     # Playwright specs; requires running app at BASE_URL or localhost:3000
npm run lint         # ESLint flat config
npm run typecheck    # next build --webpack, not plain tsc
npm run verify       # lint + Node tests + build + prisma validate
npm run prisma:generate
npm run prisma:validate
npm run prisma:deploy
```

`postinstall` runs `prisma generate`. `scripts/vercel-build.mjs` attempts `prisma migrate deploy` only when `DATABASE_URL` is present in Vercel/production contexts, currently warning and continuing on migration failure.

## Code Conventions & Common Patterns

- **Imports:** Use the `@/*` alias for `src/*`. The repo is ESM (`"type": "module"`).
- **TypeScript:** `strict` mode, `noEmit`, `isolatedModules`, `moduleResolution: "bundler"`, JSX via `react-jsx`.
- **Server/client boundary:** Never import `src/lib/server/**`, Prisma, `next/cache`, or auth server utilities into client components. Client files use `'use client'` and browser-safe hooks/helpers.
- **Route handlers:** Prefer exported HTTP functions (`GET`, `POST`, etc.). Keep business logic in testable helpers or server stores. For auth handlers, dependency injection is common (for example `handleLoginPost(request, deps)`) to support focused tests.
- **Errors:** Protected routes commonly use `try/catch` with `errorResponse(error)`. User-facing errors are Korean. `AuthError` carries HTTP status.
- **Auth/authorization:** Use `requireRole('ADMIN', 'OWNER')` for admin/owner APIs. Owners must be scoped to their own resources; do not trust client-supplied `ownerId` without normalization/checks.
- **Async/data mapping:** Stores map Prisma records to serializable DTOs (`mapShop`, `mapShopList`) and convert `Date` to ISO strings before sending to clients.
- **Search/filter flow:** Directory query parsing and canonicalization belong in `src/lib/directory-mode.ts`; sorting helpers live in `src/lib/directory-sort.ts`.
- **Catalogs:** Region/theme constants appear in both `src/lib/catalog.ts` and `src/lib/types.ts`; check both before adding or renaming catalog values to avoid drift.
- **Frontend ownership:** Frontend UI files (`src/components/**`, `src/app/**/page.tsx`, auth/board/admin pages) are design-owned. Make minimal, non-visual diffs unless explicitly asked. Never replace real API calls with mocks/localStorage/setTimeout fallbacks.
- **Next.js version caution:** This repo uses newer Next.js APIs. Before changing Next-specific behavior, consult `node_modules/next/dist/docs/` for the installed version.

## Important Files

- `src/app/layout.tsx` — root metadata, Korean locale, Pretendard font, `GlobalLayout` wrapper.
- `src/app/page.tsx` — public homepage data orchestration and client hydration.
- `src/middleware.ts` — `/admin` cookie redirect guard only.
- `src/app/api/shops/route.ts` — public shop directory API.
- `src/app/api/auth/login/post.ts` — login handler with rate-limit headers, session cookie, dependency injection.
- `src/app/api/admin/shops/route.ts` — admin/owner shop listing and creation pattern.
- `src/lib/server/shop-store.ts` — public shop queries, DTO mapping, caching, premium/visibility mutations.
- `src/lib/server/communityStore.ts` — community/admin transitional store logic.
- `src/lib/db/prisma.ts` — shared Prisma client and PostgreSQL pool.
- `src/lib/auth/guards.ts`, `src/lib/auth/session.ts`, `src/lib/auth/http.ts` — auth/session/error primitives.
- `src/lib/security/http.ts`, `src/lib/security/rate-limit.ts` — baseline security headers and in-memory rate limiting.
- `prisma/schema.prisma` — current database shape.
- `scripts/run-tests.mjs` — safe custom Node test runner and test DB guard.
- `next.config.ts` — global security headers and Webpack watch options; Turbopack config was removed.
- `playwright.config.ts` — serial Chromium Playwright config.

## Runtime/Tooling Preferences

- **Runtime:** Node.js. The custom test runner uses Node 22 features and falls back to `npx -y node@22` when the local Node major is lower.
- **Package manager:** npm is implied by `package-lock.json`, `npm run ...`, and `npx`; no `packageManager` or engine pin is present.
- **Database:** PostgreSQL. Default local URL is `postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public`; tests rewrite/guard this to `live_commerce_test`.
- **Next runtime:** Keep backend routes on Node runtime assumptions; Prisma, `pg`, crypto/session handling, and Next cache APIs are not Edge-safe by default.
- **Bundler:** Development/build/typecheck force Webpack (`--webpack`). Do not reintroduce Turbopack config casually.
- **Styling:** Tailwind CSS 4 with global styles in `src/app/globals.css`; preserve existing UI class patterns unless doing an explicit design task.

## Testing & QA

- **Node tests:** `npm test` runs only `tests/**/*.test.ts` through `scripts/run-tests.mjs`. It seeds with `prisma/seed.ts`, imports `tsx`, registers `@/*` aliases, and refuses non-test databases.
- **Focused Node test example:**

```bash
npm test -- tests/auth-route-rate-limit.test.ts
```

- **Playwright specs:** `npm run test:e2e` runs `*.spec.ts` under `tests/` with one Chromium worker. It expects a live app at `BASE_URL` or `http://localhost:3000` and seeded accounts/data.
- **Test style:** Use `node:test` + `node:assert/strict` for route/helper tests. Construct `Request` objects directly and inject dependencies where handlers support it. Assert exact status codes, JSON bodies, headers, and auth behavior.
- **E2E/API style:** Playwright specs use deterministic unique data, Prisma setup/cleanup, role actors (`anonymous`, `user`, `owner`, `admin`), Korean visible text, and `waitForResponse`/`expect.poll` for session flows.
- **Coverage expectations:** Add focused tests for changed branch behavior: auth failures, owner/admin permissions, malformed query params, cache invalidation after mutations, cookie/session behavior, and database-backed mapping.
- **Verification:** For backend changes, run the narrowest relevant `npm test -- tests/...test.ts`; for UI/session flows, run the relevant Playwright spec after starting the app.
