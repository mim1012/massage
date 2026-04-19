# Backend Integration Plan

## Purpose

This document defines the remaining backend and database work for the current massage directory project.

The current codebase is a frontend-heavy prototype:

- Most pages read from `src/lib/mockData.ts`
- Authentication is simulated in the client
- Admin actions update only local React state
- There is no real database, ORM, or API layer yet

This document is the implementation reference for replacing the mock-based flow with a production-backed flow.

## Current Status

### Already implemented

- Public pages and admin pages exist in the Next.js App Router structure
- Core domain shapes are roughly modeled in `src/lib/types.ts`
- User flows are visible in the UI:
  - user registration
  - owner registration
  - login
  - shop list
  - shop detail
  - Q&A
  - admin approvals
  - admin shop management

### Not implemented yet

- Real database connection
- Schema migrations
- Seed setup
- Auth/session persistence
- Role and permission enforcement
- Server-side CRUD APIs
- Real admin actions
- Real Q&A / review / notice persistence
- Real statistics aggregation

## Recommended Architecture

Keep the backend inside the current Next.js app unless a separate service becomes necessary later.

### Stack

- Frontend: Next.js App Router
- Backend: Next.js Route Handlers under `src/app/api/*`
- Database: PostgreSQL
- ORM: Prisma
- Auth: session-based auth with role checks
- Validation: request validation on every write endpoint

### Why this path

- Lowest integration cost with the current project structure
- No separate backend deployment required initially
- Good fit for admin + owner + user role model
- Prisma gives straightforward schema, migration, and query ergonomics

## Proposed Directory Shape

```text
src/
  app/
    api/
      auth/
      shops/
      qna/
      notices/
      admin/
      owner/
  lib/
    auth/
    db/
    repositories/
    validators/
prisma/
  schema.prisma
  seed.ts
docs/
  backend-integration-plan.md
```

## Domain Model

### 1. users

Purpose: all authenticated identities.

Fields:

- `id`
- `email` unique
- `password_hash`
- `name`
- `role` enum: `ADMIN | OWNER | USER`
- `status` enum: `PENDING | APPROVED | REJECTED`
- `phone` nullable
- `created_at`
- `updated_at`

Notes:

- `USER` accounts can be approved by default
- `OWNER` accounts should start as `PENDING`
- `ADMIN` accounts are seeded or manually provisioned

### 2. owner_profiles

Purpose: owner-only business metadata.

Fields:

- `user_id` unique
- `business_name`
- `business_number`
- `approval_memo` nullable
- `approved_at` nullable
- `approved_by` nullable

### 3. shops

Purpose: shop master data.

Fields:

- `id`
- `owner_id`
- `name`
- `slug` unique
- `region`
- `sub_region` nullable
- `theme`
- `tagline`
- `description`
- `address`
- `phone`
- `hours`
- `is_visible`
- `is_premium`
- `premium_order` nullable
- `thumbnail_url` nullable
- `banner_url` nullable
- `created_at`
- `updated_at`

### 4. shop_images

Purpose: ordered image gallery per shop.

Fields:

- `id`
- `shop_id`
- `image_url`
- `sort_order`

### 5. shop_courses

Purpose: service/course menu per shop.

Fields:

- `id`
- `shop_id`
- `name`
- `duration_minutes`
- `price`
- `description` nullable
- `sort_order`

### 6. reviews

Purpose: user-authored shop reviews.

Fields:

- `id`
- `shop_id`
- `user_id`
- `rating`
- `content`
- `created_at`

Rules:

- Only authenticated users can write
- One user per shop review policy is optional and can be added later

### 7. qna

Purpose: public or shop-specific questions and admin answers.

Fields:

- `id`
- `shop_id` nullable
- `user_id` nullable
- `author_name`
- `question`
- `answer` nullable
- `answered_by` nullable
- `answered_at` nullable
- `status` enum: `OPEN | ANSWERED`
- `created_at`

### 8. notices

Purpose: admin-managed announcements.

Fields:

- `id`
- `title`
- `content`
- `is_pinned`
- `created_by`
- `created_at`
- `updated_at`

### 9. audit_logs

Purpose: traceable admin and owner actions.

Fields:

- `id`
- `actor_user_id`
- `action`
- `target_type`
- `target_id`
- `payload` JSON nullable
- `created_at`

Recommended uses:

- owner approval / rejection
- shop visibility toggle
- premium placement change
- notice edits

## API Surface

## Authentication

### `POST /api/auth/register/user`

Creates a normal user account.

Request:

- `name`
- `email`
- `password`

Response:

- created user summary

### `POST /api/auth/register/owner`

Creates an owner account in pending state.

Request:

- `name`
- `email`
- `password`
- `businessName`
- `businessNumber`
- `phone`

Response:

- pending owner registration result

### `POST /api/auth/login`

Authenticates a user and creates a session.

Rules:

- reject invalid credentials
- reject owner accounts that are not approved

### `POST /api/auth/logout`

Clears the session.

### `GET /api/auth/me`

Returns current authenticated user summary.

## Shops

### `GET /api/shops`

Public searchable list endpoint.

Query params:

- `region`
- `subRegion`
- `theme`
- `q`
- `page`
- `pageSize`

Response:

- premium shops
- regular shops
- pagination metadata

### `GET /api/shops/:slug`

Public shop detail endpoint.

Response:

- shop core fields
- image gallery
- courses
- recent reviews

### `POST /api/owner/shops`

Creates a shop for the authenticated approved owner.

### `PATCH /api/owner/shops/:id`

Updates the owner’s own shop.

Rules:

- owner can edit only owned shops
- admin can optionally override with separate admin endpoints

### `GET /api/owner/shops/me`

Returns shops owned by the current owner.

### `PATCH /api/admin/shops/:id/visibility`

Toggles or sets visible status.

### `PATCH /api/admin/shops/:id/premium`

Sets premium status and optional premium order.

## Approvals

### `GET /api/admin/approvals`

Returns pending and processed owner approvals.

### `PATCH /api/admin/approvals/:userId/approve`

Approves owner account.

Effects:

- user status becomes `APPROVED`
- approval metadata is stored
- audit log written

### `PATCH /api/admin/approvals/:userId/reject`

Rejects owner account.

Effects:

- user status becomes `REJECTED`
- audit log written

## Reviews

### `GET /api/shops/:shopId/reviews`

Returns review list for a shop.

### `POST /api/shops/:shopId/reviews`

Creates a review.

Rules:

- authenticated user only
- validate rating range and content length

## Q&A

### `GET /api/qna`

Returns all Q&A or filtered shop-specific Q&A.

Query params:

- `shopId`

### `POST /api/qna`

Creates a question.

### `PATCH /api/admin/qna/:id/answer`

Adds or updates an admin answer.

## Notices

### `GET /api/notices`

Returns notice list.

### `GET /api/notices/:id`

Returns one notice.

### `POST /api/admin/notices`

Creates notice.

### `PATCH /api/admin/notices/:id`

Updates notice.

## Frontend Replacement Map

The following screens currently depend on mock data or client-only state and must be rewired.

### Public

- `/` -> `GET /api/shops`
- `/shop/[slug]` -> `GET /api/shops/:slug`
- `/board/qna` -> `GET /api/qna`, `POST /api/qna`
- `/board/review` -> review list API
- `/board/notice` -> notice list/detail APIs

### Auth

- `/auth/login` -> `POST /api/auth/login`
- `/auth/register/user` -> `POST /api/auth/register/user`
- `/auth/register-owner` -> `POST /api/auth/register/owner`

### Admin

- `/admin` -> aggregated counts/statistics endpoint
- `/admin/approvals` -> approvals APIs
- `/admin/shops` -> admin shop list + visibility/premium APIs
- `/admin/qna` -> answer management API
- `/admin/notice` -> notice CRUD APIs

## Delivery Phases

### Phase 1. Foundation

- Add Prisma
- Add PostgreSQL connection
- Create schema
- Create first migration
- Add seed data
- Add shared DB client

Exit criteria:

- database boots locally
- migrations run cleanly
- seed loads basic admin/user/shop records

### Phase 2. Authentication and Authorization

- Implement registration endpoints
- Implement login/logout/session
- Implement `me` endpoint
- Implement role guard helpers
- Implement owner approval gate

Exit criteria:

- user registration works
- owner registration works
- unapproved owner login is blocked
- role-based route protection exists

### Phase 3. Shop APIs

- Implement public shop listing
- Implement shop detail
- Implement owner shop create/update
- Implement admin visibility/premium actions

Exit criteria:

- home page uses DB-backed listing
- detail page uses DB-backed detail
- owner can update own shop
- admin actions persist

### Phase 4. Community and Operations

- Implement reviews
- Implement Q&A
- Implement notices
- Implement admin dashboard counts

Exit criteria:

- Q&A persists across reloads
- notices persist across reloads
- reviews persist across reloads
- admin dashboard reads real counts

### Phase 5. Hardening

- Add request validation
- Add audit logs
- Add error handling
- Add pagination and query safety
- Add basic test coverage
- Remove remaining mock imports

Exit criteria:

- no user-visible page relies on `src/lib/mockData.ts`
- write endpoints are validated
- important admin actions are logged

## Priority Order

Recommended implementation order:

1. Prisma + PostgreSQL setup
2. Auth + roles + owner approval
3. Shop list/detail + owner shop management
4. Admin approvals + admin shop controls
5. Q&A + notices + reviews
6. Dashboard metrics + audit logs + tests

## Completion Definition

The backend integration is complete when all of the following are true:

- mock data imports are removed from runtime screens
- database-backed entities persist across refresh and restart
- login state persists correctly
- admin / owner / user permission boundaries are enforced
- owner registration -> admin approval -> owner login -> shop edit flow works end to end
- admin visibility and premium controls persist
- Q&A, notices, and reviews are stored in DB
- baseline verification exists for critical flows

## Known Risks

- Current mock data contains broken text encoding and should not be copied blindly into production seed data
- Role handling is currently simulated in the UI and must be replaced fully, not incrementally mixed
- Premium ordering needs a clear business rule before UI and API are finalized
- File upload/image hosting is not designed yet and should stay out of the first backend milestone unless required

## Suggested Immediate Next Task

Start with:

1. Add Prisma and PostgreSQL configuration
2. Create `prisma/schema.prisma`
3. Generate first migration
4. Add seed data for one admin, one owner, one user, and a small shop dataset
5. Implement auth endpoints before touching admin screens
