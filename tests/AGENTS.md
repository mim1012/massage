# TEST KNOWLEDGE

## Overview

`tests/` mixes Node route/helper tests (`*.test.ts`) and Playwright specs (`*.spec.ts`) with separate runners.

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Node test runner | `../scripts/run-tests.mjs` | Seeds first, rewrites DB URL to `live_commerce_test`, runs files sequentially. |
| Playwright config | `../playwright.config.ts` | Chromium only, one worker, `BASE_URL` default `http://localhost:3000`. |
| Auth/session regressions | `auth-*.test.ts`, `*.spec.ts` role flows | Session cookie is `massage_session`. |
| Admin source guards | `admin-*-source-guards.test.ts` | Many tests assert authorization/cache code remains present. |
| Community/store coverage | `community-store*.test.ts`, `review-*.test.ts`, `qna-*.test.ts` | Prefer focused branch tests for store changes. |
| Production probes | `prod-*.spec.ts`, `scratch/prod-login-render-check.mjs` | External URL checks may need the approved prod script path. |
| UI interaction tests | `*-page.interaction.test.ts` | JSDOM-style component tests with mocked `fetch`/router behavior. |

## Conventions

- Use `node:test` and `node:assert/strict` for `*.test.ts`.
- Construct `Request` objects directly for route helpers and inject dependencies where handlers support it.
- Keep deterministic test data and clean up Prisma-created records.
- Add source-guard tests when the regression is about preserving an authorization, cache, or runtime boundary.
- For browser flows, start the app first unless targeting an external `BASE_URL`.
- Production URL login/render checks should use `node scratch\prod-login-render-check.mjs` from this workspace when that path matches the scenario.

## Anti-Patterns

- Do not weaken or delete source guards to make a refactor pass.
- Do not run tests against non-test databases; the runner intentionally refuses unknown DB names.
- Do not assume `npm run typecheck` covers tests; `tsconfig.json` excludes `tests/**/*`.
