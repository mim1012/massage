# SERVER STORE KNOWLEDGE

## Overview

This directory owns Prisma-backed persistence, DTO mapping, cache tags, and admin/public data assembly.

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Public shop queries | `shop-store.ts` | Largest cache-sensitive public read surface. |
| Admin/community data | `communityStore.ts` | Notices, reviews, Q&A, dashboard, managed shops, site settings. |
| Auth persistence | `auth-store.ts` | Users, sessions, owner approval, login/register. |
| Admin shop write normalization | `admin-shop-access.ts` | Owner/admin scoping for shop saves. |
| Admin stats/cache | `admin-stats.ts`, dashboard exports in `communityStore.ts` | Cache tags are covered by source guards. |
| Ads/themes/legal | `ad-banner-store.ts`, `theme-store.ts`, `legal-documents.ts` | Public content stores with separate cache tags. |
| DB retry behavior | `../db/retry.ts` | Use for transient database failure handling. |
| Media variants | `shop-media.ts` | Keep proxy URL sizes and variant contracts in sync. |

## Conventions

- Treat Prisma records as internal. Map to serializable DTOs before returning to routes/pages.
- Convert `Date` values to ISO strings when crossing a JSON/client boundary.
- Keep `Prisma.*Select` / `satisfies Prisma.*` shapes near the query they protect.
- Preserve module-level Promise caches and `unstable_cache` tags unless changing invalidation deliberately.
- When changing public shop state, call `invalidatePublicShopCaches()` or the narrower invalidator that matches the surface.
- `communityStore.ts` is large and transitional; prefer small extracted helpers only when they reduce real duplication.
- Use `withDatabaseRetry` for query paths where transient connection failures are already part of the local pattern.

## Anti-Patterns

- Do not import these modules into client components.
- Do not treat `src/lib/mockData.ts` as the runtime source of truth for persisted flows.
- Do not swallow non-cache-context errors from `revalidateTag` / `unstable_cache`; existing helpers only tolerate missing Next cache context.
- Do not return Prisma payloads with raw dates, relations, or private fields directly to public APIs.
