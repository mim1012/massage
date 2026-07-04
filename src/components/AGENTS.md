# COMPONENT KNOWLEDGE

## Overview

`src/components/` owns shared, public, admin, and owner UI pieces. Most files here are client components or are imported by App Router pages.

## Structure

| Area | Location | Notes |
|------|----------|-------|
| Public directory UI | `public/HomePageClient.tsx`, `public/Top100PageClient.tsx`, `ShopCard.tsx` | Uses API routes for pagination, sorting, prefetch, and review stats. |
| Public board forms | `public/ReviewPageClient.tsx`, `public/QnaPageClient.tsx`, `public/ShopReviewForm.tsx` | Auth is checked through `/api/auth/me`; mutations go through board APIs. |
| Public chrome/media | `Header.tsx`, `Sidebar.tsx`, `public/*Banner*`, `public/ShopMediaSection.tsx` | Keep mobile/desktop parity tests in mind. |
| Admin work surfaces | `admin/**` | Dense management UI paired with `/api/admin/**` and server DTOs. |
| Owner work surfaces | `owner/**` | Owner-facing shop management wrappers over shared admin DTOs. |

## Conventions

- Files with hooks, browser APIs, router usage, or event handlers must start with `'use client'`.
- Client components call real API routes; do not import Prisma, `src/lib/server/**`, `next/cache`, or server auth helpers.
- Keep Korean UI copy consistent with nearby admin/public vocabulary.
- Preserve stable dimensions for cards, rails, media slots, pagination controls, and shop tiles to avoid layout shifts.
- Use existing helpers such as `SmartPrefetchLink`, `shop-review-stats`, and admin management helpers before adding new local state machinery.
- Public components often rely on `src/lib/types.ts` DTOs; keep DTO changes synchronized with API/store mapping.

## Anti-Patterns

- Do not replace real network flows with mock/localStorage/setTimeout persistence fallbacks.
- Do not move server data fetching from App Router pages into client components unless the existing flow is already client-owned.
- Do not widen owner/admin UI capabilities without matching API authorization and tests.
- Do not make visual rewrites in shared public components as part of backend or data-only work.
