# Launch Readiness Report — 2026-06-05

## 결론

**현재 상태: 운영 모드 핵심 E2E 16/16 통과, 조건부 서비스 오픈 가능**

Docker 기반 Postgres 테스트 DB(`live_commerce_test`)와 Next production build/start 기준으로 게시판 CRUD 권한, 인증, 리뷰 작성/수정/삭제, 사이드바/상단 메뉴/역할별 헤더 노출을 재검증했다.

최종 운영 E2E는 `AUTH_COOKIE_SECURE=false`를 사용한 로컬 HTTP 운영 서버에서 실행했다. 실제 운영 HTTPS 환경에서는 기본값대로 `secure` 세션 쿠키가 유지되어야 하며, 로컬 HTTP E2E에서만 secure 쿠키 저장 문제를 피하기 위해 명시 override를 사용했다.

## 이번 점검에서 추가/수정한 사항

- `src/lib/auth/session.ts`
  - production 기본값은 secure cookie 유지.
  - 로컬 HTTP 운영 E2E를 위해 `AUTH_COOKIE_SECURE=false`일 때만 secure cookie를 끄는 명시적 테스트 override 추가.
- `tests/board-crud-permissions.spec.ts`
  - 실제 로그인 API 세션 기반 게시판 CRUD 권한 매트릭스 E2E 추가.
  - anonymous / USER / OWNER / other OWNER / ADMIN 조합으로 공지, 리뷰, Q&A, 제휴문의 권한 검증.
- `tests/sidebar-navigation.spec.ts`
  - 미검증 사이드바/상단 메뉴 반영 검증 추가.
  - 지역/서울/인기순위/신규/공지/Q&A/후기/광고, 상단 커뮤니티, 역할별 헤더 메뉴(USER/OWNER/ADMIN) 검증.
- `tests/e2e/auth.spec.ts`
  - `BASE_URL` 기반 운영 서버 테스트 지원.
  - `networkidle` 과의존 제거, 실제 폼/세션/관리자 대시보드 접근 기준으로 안정화.
- `tests/review-flow.spec.ts`
  - `BASE_URL` 기반 운영 서버 테스트 지원.
  - 성인 인증 게이트 우회 및 로그인 폼 가시성 기준 대기로 안정화.
- 기존 유지보수 수정
  - Next 16.2.7 업데이트, unused `vercel` dependency 제거.
  - admin premium 테스트 mock API 계약 보정.
  - lint/build blocker 최소 수정.

## 최종 검증 결과

| 항목 | 명령 | 결과 |
| --- | --- | --- |
| Production build | `DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/live_commerce_test?schema=public' npm run build` | PASS |
| 운영 서버 smoke | `PORT=3101 HOSTNAME=127.0.0.1 AUTH_COOKIE_SECURE=false ... npm start` + `/auth/login` | PASS |
| 로그인 API smoke | `POST /api/auth/login` | PASS, 200 + `massage_session` cookie 발급 |
| Security audit high gate | `npm audit --audit-level=high` | PASS, high/critical 0건, moderate 5건 잔존 |
| 변경 파일 lint | `npx eslint src/lib/auth/session.ts tests/board-crud-permissions.spec.ts tests/sidebar-navigation.spec.ts tests/e2e/auth.spec.ts tests/review-flow.spec.ts --no-cache` | PASS |
| 최종 운영 E2E | `BASE_URL=http://127.0.0.1:3101 ... npx playwright test tests/sidebar-navigation.spec.ts tests/board-crud-permissions.spec.ts tests/e2e/auth.spec.ts tests/review-flow.spec.ts --reporter=list` | **PASS 16/16** |

## 최종 운영 E2E 상세

| 영역 | 검증 | 결과 |
| --- | --- | --- |
| 공지 권한 | public GET 허용, admin create/update/delete 허용, anonymous/USER/OWNER admin mutation 차단 | PASS |
| public 리뷰 권한 | anonymous create 차단, USER 본인 update/delete 허용, OWNER/other OWNER 타인 mutation 차단, ADMIN public update 허용 | PASS |
| 관리 리뷰 권한 | USER 차단, OWNER 자기 업소 create/update 허용, other OWNER 타 업소 차단, ADMIN delete 허용 | PASS |
| public Q&A 권한 | anonymous create 차단, USER 본인 update/delete 허용, OWNER/ADMIN public 타인 mutation 차단, 답변/상태 변경 후 USER update/delete 409 차단 | PASS |
| 관리 Q&A 권한 | USER 차단, 해당 OWNER update/delete 허용, other OWNER 타 업소 차단, ADMIN 허용 | PASS |
| 제휴문의 권한 | public create 허용, 필수값 누락 400, 상태변경/삭제는 ADMIN만 허용 | PASS |
| 인증 UI | USER/OWNER/ADMIN 로그인, OWNER logout redirect, PENDING owner 거절, refresh 후 세션 유지 | PASS |
| 리뷰 UI/API | 로그인 후 리뷰 작성, 화면 노출, API 수정, API 삭제 | PASS |
| 사이드바 메뉴 | 지역별/서울/인기순위/신규/공지/Q&A/후기/광고 링크 반영 | PASS |
| 상단/역할 메뉴 | 상단 주요 메뉴 노출, 커뮤니티 이동, USER/OWNER/ADMIN 헤더 메뉴 반영 | PASS |

## 잔여 리스크 / 오픈 전 확인사항

| 항목 | 상태 | 영향/조치 |
| --- | --- | --- |
| `npm audit` moderate 5건 | 잔존 | high gate는 통과. `prisma` dev 의존성 및 `next` 내부 `postcss` advisory. `npm audit fix --force`는 breaking/downgrade 성격이라 보류. |
| Lint warnings | 잔존 | 런칭 hard blocker는 아니나 image optimization/hook dependency/unused 계열 경고 정리 권장. |
| Next 경고 | 잔존 | `middleware` 파일 convention deprecated, `proxy` 마이그레이션 권장. |
| 로컬 E2E 쿠키 override | 의도적 | 실제 HTTPS 운영에서는 `AUTH_COOKIE_SECURE=false`를 쓰지 말 것. 로컬 HTTP 운영 E2E 전용. |
| 운영 환경변수/도메인 | 미검증 | 실제 배포 전 `DATABASE_URL`, `SESSION_SECRET`, 도메인 HTTPS, 관리자 계정, 모니터링/백업 확인 필요. |
| Git worktree metadata | 관찰됨 | plain `git status`가 stale worktree 경로 때문에 실패 가능. 배포 브랜치에서 worktree metadata 정리 권장. |

## 최종 판정

- **빌드 준비도:** PASS
- **게시판 CRUD 권한:** PASS
- **인증/세션:** PASS
- **리뷰 작성/수정/삭제:** PASS
- **사이드바/상단/역할 메뉴:** PASS
- **보안 high gate:** PASS
- **런칭 판단:** **조건부 오픈 가능.** 실제 운영 HTTPS/환경변수/도메인/DB 백업/모니터링 확인 후 사용자 트래픽을 받을 수 있다.

---

## Production Deploy — 2026-06-05

### 배포 결과

- Vercel production deploy: **PASS**
- Deployment ID: `dpl_EAzQ52Ew3ozebUNQKv2gofH1PX9P`
- Production URL: `https://massage-8pg2q67vs-dksk0359-7464s-projects.vercel.app`
- Production alias: `https://massage-green.vercel.app`
- Inspect URL: `https://vercel.com/dksk0359-7464s-projects/massage/EAzQ52Ew3ozebUNQKv2gofH1PX9P`
- Vercel status: **Ready**

### 배포 전 검증

| 항목 | 결과 |
| --- | --- |
| `npx vercel pull --yes --environment=production` | PASS |
| `npx vercel build --prod` | PASS |
| Production DB `prisma migrate deploy` | PASS, pending migration 없음 |
| Build output API 산출물 | PASS, `.vercel/output` 생성 |

### 배포 후 smoke

| URL/API | 결과 |
| --- | --- |
| `/` | HTTP 200 |
| `/auth/login` | HTTP 200 |
| `/board/notice` | HTTP 200 |
| `/top100` | HTTP 200 |
| `/board/qna` | HTTP 200 |
| `/ad` | HTTP 200 |
| `/api/site-settings` | HTTP 200 |
| `/api/shops?limit=1` | HTTP 200 |
| `/shop/hongdae-aromatherapy` | HTTP 200 |
| `/api/shops/hongdae-aromatherapy` | HTTP 200 |

### 배포 중 조치

- `.vercelignore` 추가: `.omx`, `.claude`, `.gstack`, 테스트 결과, 로그 등 로컬 런타임 산출물이 Vercel 업로드/스캔에 포함되지 않도록 제외.
- 최초 Vercel build 실패 원인: `.omx/state/notify-fallback-authority.lock/owner.json` stale runtime path scan 실패.
- 재실행 결과: build/deploy 성공.

### 배포 후 주의사항

- Production DB에는 로컬 테스트 seed(`healing-spa-seoul`, `user@massage.local`)가 없어 해당 slug/login smoke는 실패하는 것이 정상이다.
- 실제 운영 데이터 기준 `hongdae-aromatherapy` 상세와 API는 200으로 확인했다.
- 이번 배포는 Vercel prebuilt output 직접 업로드 방식으로 성공했다. git metadata stale worktree 문제 때문에 현재 `git status`/commit/push는 추가 정리가 필요하다.
