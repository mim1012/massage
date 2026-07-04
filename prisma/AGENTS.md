# PRISMA KNOWLEDGE

## Overview

Prisma schema and migrations are the persisted contract for shops, users, owners, content, analytics, and moderation.

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Data model | `schema.prisma` | Source of truth for persisted shape and indexes. |
| Migration history | `migrations/**/migration.sql` | Current chain runs through public/popular filter indexes. |
| Seed data | `seed.ts` | Creates local admin/owner/user credentials and sample content. |
| Prisma CLI config | `../prisma.config.ts` | Defines schema path, seed command, and default local DB URL. |
| Build migration wrapper | `../scripts/vercel-build.mjs` | May run `prisma migrate deploy` before `next build --webpack`. |

## Conventions

- Use PostgreSQL assumptions; local default DB is `massage_directory`, tests rewrite to `live_commerce_test`.
- Preserve Prisma 7 / `@prisma/adapter-pg` runtime assumptions in `src/lib/db/prisma.ts`.
- Add migrations for persisted schema changes; do not rely on code-only shape changes.
- Keep seed data compatible with auth, owner approval, public directory, and admin workflows.
- Validate with `npm run prisma:validate` or `npx prisma validate` after schema edits.

## Anti-Patterns

- Do not point local test runs at production or unknown databases.
- Do not treat docs as authoritative over `schema.prisma`.
- Do not add production-only required env behavior without checking `scripts/vercel-build.mjs` and `src/lib/db/prisma.ts`.
