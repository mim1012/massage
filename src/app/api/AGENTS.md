# API ROUTE KNOWLEDGE

## Overview

Route handlers are thin HTTP adapters over auth, validation, and `src/lib/server/**` stores.

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Public directory listing | `shops/route.ts` | Canonical redirect, bounded pagination, `public, s-maxage=300`. |
| Shop media proxies | `shops/[slug]/**/route.ts` | Keep media size/version query behavior aligned with `shop-store`. |
| Admin shop CRUD | `admin/shops/**/route.ts` | Uses `requireRole('ADMIN', 'OWNER')` plus ownership checks. |
| Login/register/session | `auth/**/route.ts`, `auth/login/post.ts` | Login logic is dependency-injected for focused tests. |
| Board/Q&A/review APIs | `board/**/route.ts`, `admin/qna/**`, `admin/reviews/**` | Public and admin moderation paths share server-store helpers. |
| Cron prewarm | `cron/prewarm-directory/route.ts` | Protected by `CRON_SECRET`; production cache behavior matters. |
| Public content/settings | `site-settings/route.ts`, `themes/route.ts`, `ad-banners/route.ts` | Keep cache headers and public DTO shape stable. |

## Conventions

- Export HTTP functions directly: `GET`, `POST`, `PATCH`, `DELETE`.
- Parse `Request`/`NextRequest` locally, then delegate persistence to `src/lib/server/**`.
- Protected handlers wrap logic in `try/catch` and return `errorResponse(error)`.
- User-facing error strings are Korean unless the existing handler uses generic auth errors.
- Use `Response.json(...)`; add explicit cache headers for public/private distinction.
- Keep API handlers Node-runtime safe. Do not move Prisma/`pg` paths toward Edge assumptions.
- Prefer dependency-injected helper modules for auth/register/login behavior so route tests can avoid full HTTP servers.

## Anti-Patterns

- Do not trust client-supplied `ownerId`; normalize or verify with `assertOwnershipOrAdmin`.
- Do not add local mock, `localStorage`, or timeout fallbacks to API behavior.
- Do not mutate shop/review/Q&A state without checking the related cache invalidation path.
- Do not put broad business logic in route files when it can live in a testable helper/store.
- Do not expose private Prisma fields when returning public review/Q&A/shop data.
