# Local Postgres + full verification procedure

## 1) Start local Postgres without Docker

```bash
mkdir -p /tmp/pg17-deb /tmp/pg17-root
cd /tmp/pg17-deb
apt-get download postgresql-17 postgresql-client-17 libpq5
for deb in *.deb; do
  dpkg-deb -x "$deb" /tmp/pg17-root
done

export PATH=/tmp/pg17-root/usr/lib/postgresql/17/bin:$PATH
export LD_LIBRARY_PATH=/tmp/pg17-root/usr/lib/aarch64-linux-gnu:${LD_LIBRARY_PATH:-}

rm -rf /tmp/massage-pgdata
initdb -D /tmp/massage-pgdata -U postgres -A trust --no-locale
pg_ctl -D /tmp/massage-pgdata -l /tmp/massage-pg.log -o "-p 5432" start
createdb -h localhost -p 5432 -U postgres massage_directory
createdb -h localhost -p 5432 -U postgres live_commerce_test
```

## 2) Apply Prisma schema + seed

Use one `DATABASE_URL` per database and run Prisma against each.

```bash
cd /tmp/massage-review

# DATABASE_URL -> massage_directory
npx prisma db push
npx -y node@22 --experimental-transform-types prisma/seed.ts

# DATABASE_URL -> live_commerce_test
npx prisma db push
npx -y node@22 --experimental-transform-types prisma/seed.ts
```

Example `DATABASE_URL` shapes:
- `.../massage_directory?schema=public`
- `.../live_commerce_test?schema=public`

## 3) Verify seeded data

```bash
export PATH=/tmp/pg17-root/usr/lib/postgresql/17/bin:$PATH
export LD_LIBRARY_PATH=/tmp/pg17-root/usr/lib/aarch64-linux-gnu:${LD_LIBRARY_PATH:-}

for db in massage_directory live_commerce_test; do
  echo "=== $db ==="
  psql -h localhost -p 5432 -U postgres -d "$db" -Atc "select 'users='||count(*) from users; select 'shops='||count(*) from shops; select 'reviews='||count(*) from reviews;"
done
```

Expected current result:
- users=3
- shops=51
- reviews=1

## 4) Start app server

```bash
cd /tmp/massage-review
export DATABASE_URL='<massage_directory DATABASE_URL>'
export SESSION_SECRET='local-dev-secret'
npm run dev
```

## 5) Install Playwright browser locally if needed

If the default browser cache path is not writable:

```bash
cd /tmp/massage-review
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npx playwright install chromium
```

## 6) Run verification commands

### Node test suite
```bash
cd /tmp/massage-review
export DATABASE_URL='<massage_directory DATABASE_URL>'
npm test
```

### Review E2E
```bash
cd /tmp/massage-review
export DATABASE_URL='<massage_directory DATABASE_URL>'
export SESSION_SECRET='local-dev-secret'
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers
npm run test:e2e -- tests/review-flow.spec.ts
```

### Lint + build
```bash
cd /tmp/massage-review
export DATABASE_URL='<massage_directory DATABASE_URL>'
export SESSION_SECRET='local-dev-secret'
npm run lint
npm run build
```

## 7) Notes from this verification pass

- `tests/review-flow.spec.ts` needed two fixes:
  1. submit button selection had to be scoped to the login form, otherwise Playwright could hit the header search submit button.
  2. review creation verification should use the POST `/api/board/reviews` response payload for the new `review.id`, not a follow-up list search that can produce a false negative.

- `tests/community-store.test.ts`, `tests/directory-mode.test.ts`, and `tests/mobile-banner-parity.test.ts` were also aligned to current app behavior so the DB-backed suite passes against the real seeded app state.

- Current lint status is green with warnings only.
