<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-roles -->
# Project Roles

## Contributors
| GitHub | Role | Responsibility |
|--------|------|----------------|
| `dad041566-hue` | Frontend / Designer | UI, layout, design, all public-facing components and pages |
| `mim1012` | Backend | API routes, server logic, database, authentication, caching |

## Ownership by directory
- **Frontend (dad041566-hue owns)**
  - `src/app/**/page.tsx` — page components (UI layer)
  - `src/components/**` — all React components
  - `src/app/auth/**` — auth pages (UI only)
  - `src/app/board/**` — board pages (UI only)
  - `src/app/ad*/**` — advertising pages

- **Backend (mim1012 owns)**
  - `src/app/api/**` — all API routes
  - `src/lib/server/**` — server-side logic
  - `src/lib/db/**` — database layer
  - `src/lib/auth/**` — auth utilities
  - `src/lib/security/**` — security utilities
<!-- END:project-roles -->

<!-- BEGIN:agent-rules -->
# Agent Rules

## Frontend drift prevention
- **Never rewrite a frontend file** that was last authored by `dad041566-hue` without explicit instruction.
- If a frontend change is required to support a backend feature (e.g. type rename, new prop), make the **minimal diff** — do not restructure or reskin the component.
- **Never replace a real API call with a mock** (`localStorage`, `setTimeout`, hardcoded data) in any page or component. If the API does not exist yet, leave a `// TODO: wire up /api/...` comment and keep the UI shell intact.
- If you notice drift (contributor's UI overwritten), flag it and restore before proceeding.

## Backend rules
- Backend files under `src/app/api/**` and `src/lib/server/**` are owned by mim1012. You may modify these freely for backend tasks.
- Do not touch frontend component layout or styling when fixing backend bugs.

## Before every commit
- Run `git log --author="dad041566@gmail.com" --follow -- <file>` on any frontend file you modified.
- If the contributor authored it, diff your change and confirm it is a minimal, non-visual edit.
<!-- END:agent-rules -->
