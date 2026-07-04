# 운영 E2E 점검 문서 - 2026-06-24

대상 운영 서버: `https://massage-green.vercel.app`

## 목적

운영 서버에서 실제 브라우저/HTTP/API/DB 연계 기준으로 점검한 기능과 남은 리스크를 판단할 수 있도록 테스트 케이스, 커버리지, 검증 결과를 정리한다.

## 테스트 파일 구성

| 파일 | 목적 |
|---|---|
| `tests/auth-register-ui.spec.ts` | 회원가입 선택/일반회원/입점사 신청 UI |
| `tests/e2e/auth.spec.ts` | 로그인, 로그아웃, 세션 유지, 권한별 접근 |
| `tests/board-crud-permissions.spec.ts` | 공지/리뷰/Q&A/제휴문의 CRUD 권한 매트릭스 |
| `tests/registration-owner-review-workflow.spec.ts` | 일반회원 가입, 입점사 승인, 업소 등록, 리뷰 관리 연계 |
| `tests/review-flow.spec.ts` | 상세 페이지 리뷰 작성/수정/삭제 |
| `tests/role-ui-detail.spec.ts` | 역할별 실제 버튼/모달/관리 UI 클릭 플로우 |
| `tests/sidebar-navigation.spec.ts` | 사이드바/상단 메뉴/헤더 역할별 네비게이션 |
| `tests/prod-expanded-flows.spec.ts` | 운영 확장 검증: 디렉토리, TOP100, 설정, 테마, 배너, 통계, analytics |
| `tests/prod-remaining-flows.spec.ts` | 잔여 고위험 영역: 업소 CRUD, 업로드, 회원관리, 법적문서, 제휴문의, 모바일, 음성 경로 |
| `tests/prod-edge-cases.spec.ts` | 운영 엣지 검증: malformed auth JSON, 변조 세션, 없는 업소/미디어, abusive pagination clamp, invalid TOP100 filter, 모바일 후기 CRUD, 업로드 10개 초과 차단 |

## 현재까지 점검한 시나리오

### 인증/세션

- 로그인 UI 탭 전환, 비밀번호 표시 토글, 링크 이동
- 일반회원 로그인, 세션 확인, 로그아웃
- 업주 로그인, 내 업소관리 노출, 로그아웃
- 업주 페이지에서 로그아웃 시 로그인 페이지 리디렉션
- 관리자 로그인 후 `/admin` 접근
- 승인 대기 업주 로그인 차단
- 새로고침 후 세션 유지
- 로그인 API rate-limit 영향을 피하기 위한 운영 E2E 전용 forwarded IP 분리

### 회원가입/승인/입점 연계

- 회원가입 선택 페이지에서 일반회원/입점사 화면 이동
- 일반회원 가입 UI와 필수 동의/가입 버튼
- 입점사 가입 UI, 비밀번호 토글, 불일치 경고, 신청 완료
- 입점사 신청 후 관리자 승인/반려 버튼 실제 클릭
- 승인된 업주가 로그인 후 업소 등록/수정
- 반려 연속 클릭 시 DB 연결 오류 재현 및 수정 검증

### 게시판/권한 CRUD

- 공지: public read 허용, create/update/delete는 ADMIN만 허용
- 리뷰: USER 본인/ADMIN 수정삭제 허용, 타 USER/OWNER 차단
- 관리 리뷰: OWNER는 자기 업소 조회/삭제만 허용, 생성/수정 차단
- Q&A: USER 본인 수정삭제, 답변/타인/미로그인 차단
- 관리 Q&A: ADMIN 원문 수정삭제, OWNER 조회/답변
- 제휴문의: public create, ADMIN status update/delete

### 리뷰/상세/미디어

- 상세 페이지 리뷰 작성
- 리뷰 DB 생성 확인
- 리뷰 수정 반영
- 리뷰 삭제 반영
- 비회원/회원 후기 버튼과 모달 동작
- 관리자 리뷰 등록/수정/삭제
- 업주 리뷰 삭제
- 상세 페이지, 리뷰 API, 썸네일/배너/갤러리 이미지 endpoint 상태 확인

### 디렉토리/업소/검색

- 지역/테마/정렬/검색 조합
- public `/api/shops` 필터 결과 확인
- TOP100 API 및 페이지 로딩
- 상세 페이지 로딩
- 관리자 업소 생성/수정
- 업소 노출/비노출 전환과 public 검색 반영
- 프리미엄 설정 API 반영

### 관리자 기능

- 사이트 설정 저장, 재조회, 원복
- 테마 생성, public themes 반영, 삭제 정리
- 광고 배너 수정, public payload 반영, 원복
- 관리자 users/stats/dashboard API
- 관리자 users/stats 페이지 로딩 dead-end 없음
- 관리자 회원관리: 이름/전화번호 수정, 일반회원 상태 변경 차단
- 법적 문서 수정, public 페이지 반영, 원복
- 이미지 업로드: 위장 파일 차단, 실제 PNG 업로드 성공, storage 정리 시도

### 모바일/네비게이션/부가

- 모바일 viewport에서 검색, 상세, 로그인/업주 로그인 탭
- 사이드바 지역/인기/신규/공지/Q&A/후기/광고 링크 이동
- 상단 메뉴 커뮤니티 이동
- 헤더 계정 메뉴가 anonymous/USER/OWNER/ADMIN별로 변경
- analytics page-view 중복 이벤트 dedupe
- 음성 경로: anonymous admin API, 잘못된 제휴문의, 잘못된 법적문서, 잘못된 premium payload
- 저참조 경로: `/ads`, `/advertise` 리디렉션, 입점사 신청 완료 페이지, `/owner/qna`, 제휴입점 public settings API
- 엣지 경로: malformed login JSON rate-limit/header 유지, 변조 세션 `user: null`, 없는 업소/썸네일 404, public directory `regularLimit` 상한 clamp, invalid TOP100 filter, 모바일 viewport 후기 작성/수정/삭제, 관리자 업로드 10개 초과 차단

## 검증 결과

아래 결과는 마지막 실행 후 업데이트한다.

| 실행 | 명령 | 결과 |
|---|---|---|
| 승인관리/비즈니스 로직 | `npm test -- tests/admin-approvals-page.interaction.test.ts tests/admin-business-logic.test.ts` | 통과 |
| 운영 확장 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-expanded-flows.spec.ts --reporter=list` | 통과: 7 passed |
| 운영 잔여 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-remaining-flows.spec.ts --reporter=list` | 통과: 8 passed |
| 운영 전체 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test --reporter=list` | 통과: 39 passed |
| 운영 배포 후 전체 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test --reporter=list` | 통과: 39 passed, 배포 `dpl_BCUXEa25KjjEjf7LURNHedVW4CVy` |
| 운영 엣지 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-edge-cases.spec.ts --reporter=list` | 통과: 2 passed, 배포 `dpl_GeP7SUvKWBguKoG76UFpigPu4kQW` |
| 운영 엣지 반영 후 전체 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test --reporter=list` | 통과: 41 passed, 배포 `dpl_GeP7SUvKWBguKoG76UFpigPu4kQW` |
| 운영 모바일/업로드 엣지 추가 후 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-edge-cases.spec.ts --reporter=list` | 통과: 4 passed |
| 운영 모바일/업로드 엣지 추가 후 전체 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test --reporter=list` | 통과: 43 passed |
| 전체 Node/DB/소스가드 테스트 | `DATABASE_URL=...live_commerce_test npm test` | 통과 |
| Firefox/WebKit 핵심 권한+엣지 smoke | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-edge-cases.spec.ts tests/e2e/auth.spec.ts --config scratch/playwright-cross-browser.config.ts --reporter=list` | 통과: 22 passed |
| 운영 API 동시 부하 probe | 8개 public API × 8회 동시 요청 | 실패 0건. warm cache 기준 directory 12-27ms, detail/summary 약 205-244ms |
| deep QA 배포 후 Chromium 전체 E2E | `BASE_URL=https://massage-green.vercel.app npx playwright test --reporter=list` | 통과: 43 passed, 배포 `dpl_46B82bgQev8zhHvpyKfPtmkW5pBM` |
| deep QA 배포 후 Firefox/WebKit smoke | `BASE_URL=https://massage-green.vercel.app npx playwright test tests/prod-edge-cases.spec.ts tests/e2e/auth.spec.ts --config scratch/playwright-cross-browser.config.ts --reporter=list` | 통과: 22 passed |
| public detail/summary 캐시 및 prewarm 확대 배포 | `npm test -- tests/mobile-banner-parity.test.ts tests/cron-prewarm-directory.test.ts`, `npm run build`, `vercel deploy --prod` | 통과 및 배포: `dpl_A8ivbg6WxhfuezpTQacwX6TFSHkK` |
| 배포 직후 latency 재측정 | shops/top/detail/summary API 2회 연속 측정 | MISS: list/top 3.5~11s, detail 1.12s, summary 1.32s. HIT/STALE: 14~297ms |

## 아직 자동화가 약한 영역

아래 항목은 이번 확장으로 대부분 보강했지만, 운영 품질 기준상 추가로 더 세밀하게 나눌 수 있다.

1. 결제/유료 상품이 생기면 PG 결제/환불/영수증 플로우 별도 필요.
2. 실제 대용량 이미지와 Supabase storage 객체 수명주기 검증은 단일/초과 개수 검증을 넘어 장기 cleanup까지 더 깊게 나눌 수 있음.
3. 관리자 업소 삭제 UI는 현재 route가 없어 DB cleanup으로 대체함.
4. DB 장애/느린 응답은 unit/source 수준 retry-safe 경로와 운영 API 부하 probe로 확인했으며, 실제 운영 DB 장애 주입은 수행하지 않음.
5. 모바일은 후기 CRUD까지 보강했지만 모든 관리자/업주 CRUD를 모바일에서 반복하지는 않음.
6. 브라우저 호환성은 Firefox/WebKit 핵심 권한+엣지 smoke까지 보강했으며, 전체 43개 E2E는 Chromium 기준으로 실행함.

## 판단 기준

- 운영 핵심 경로는 전체 E2E 통과 여부로 판단한다.
- DB mutation 테스트는 모든 생성 데이터를 cleanup하거나 원복해야 한다.
- 관리자 설정/법적문서/광고 배너처럼 운영 표시값을 바꾸는 테스트는 반드시 finally에서 원복한다.
- 실패가 발생하면 실패 spec을 단독 재실행하기 전에 원인과 prod 데이터 잔여 여부를 먼저 확인한다.
