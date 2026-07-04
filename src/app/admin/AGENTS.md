# ADMIN APP KNOWLEDGE

## Overview

Admin pages are server-rendered App Router screens plus focused client editors for Korean back-office workflows.

## Structure

| Area | Location | Notes |
|------|----------|-------|
| Shell/dashboard | `layout.tsx`, `page.tsx` | Layout is dynamic and guarded separately from middleware. |
| Shop management | `shops/**`, `components/admin/ShopEditorPage.tsx` | Owner/admin behavior must match API scoping. |
| Settings/legal/ad content | `settings/**` | Large page with editor-state helpers and preview components. |
| Moderation | `qna/**`, `reviews/**`, `notices/**` | Usually pairs with admin API routes and `communityStore`. |
| User/owner approvals | `users/**`, `approvals/**` | Admin-only; owner approval state affects login. |
| Premium/themes/banners | `premium/**`, `themes/**`, `components/admin/AdBannerManager.tsx` | These surfaces mutate public listing or visual catalog state. |

## Conventions

- Page-level auth uses `requireRole` in server components; middleware is only a coarse redirect guard.
- Keep UI text Korean and match existing management vocabulary.
- Client components should call real API routes. No local fake persistence or delayed mock fallbacks.
- Preserve dense operational layouts; this is a work surface, not a landing page.
- For forms, keep server DTO shape aligned with API route validation and store normalizers.
- Source-guard tests often assert auth/cache behavior for this area; update them only when preserving the same boundary another way.

## Anti-Patterns

- Do not widen owner access in admin pages without matching API authorization.
- Do not move Prisma/server-store imports into `'use client'` files.
- Do not replace existing editor state helpers with one-off local state if the page already centralizes dirty/reset logic.
