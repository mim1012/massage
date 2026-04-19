# 백엔드 연동 계획서

## 목적

이 문서는 현재 마사지 디렉터리 프로젝트에서 남아 있는 DB 연동 및 백엔드 연동 작업을 정의합니다.

현재 코드베이스는 프론트엔드 중심의 프로토타입 상태입니다.

- 대부분의 화면이 `src/lib/mockData.ts`를 직접 사용함
- 인증이 클라이언트에서만 시뮬레이션됨
- 관리자 액션이 로컬 React 상태만 변경함
- 실제 DB, ORM, API 계층이 아직 없음

이 문서는 목데이터 기반 흐름을 실제 운영 가능한 백엔드 구조로 바꾸기 위한 기준 문서입니다.

## 현재 상태

### 이미 구현된 것

- Next.js App Router 기반의 공개/관리자 화면 구조
- `src/lib/types.ts`에 핵심 도메인 타입 초안 존재
- 주요 사용자 흐름의 UI 존재
  - 일반 회원가입
  - 점주 회원가입
  - 로그인
  - 매장 목록
  - 매장 상세
  - Q&A
  - 관리자 승인
  - 관리자 매장 관리

### 아직 구현되지 않은 것

- 실제 데이터베이스 연결
- 스키마 마이그레이션
- 시드 데이터
- 인증/세션 유지
- 권한 및 역할 강제
- 서버 CRUD API
- 실제 관리자 액션 저장
- 실제 Q&A / 리뷰 / 공지 저장
- 실제 통계 집계

## 권장 아키텍처

별도 백엔드가 꼭 필요해질 때까지는 현재 Next.js 앱 내부에서 백엔드를 같이 운영하는 형태가 가장 단순합니다.

### 권장 스택

- 프론트엔드: Next.js App Router
- 백엔드: `src/app/api/*` 하위 Route Handler
- 데이터베이스: PostgreSQL
- ORM: Prisma
- 인증: 세션 기반 인증 + 역할 검사
- 검증: 모든 쓰기 API에 입력값 검증 적용

### 이 구조를 권장하는 이유

- 현재 프로젝트 구조와 통합 비용이 가장 낮음
- 별도 백엔드 배포가 없어도 됨
- 관리자 / 점주 / 일반회원 역할 구조에 잘 맞음
- Prisma로 스키마, 마이그레이션, 쿼리 구성이 단순함

## 권장 디렉터리 구조

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
  backend-integration-plan.ko.md
```

## 도메인 모델

### 1. users

목적: 모든 인증 사용자 계정.

필드:

- `id`
- `email` unique
- `password_hash`
- `name`
- `role` enum: `ADMIN | OWNER | USER`
- `status` enum: `PENDING | APPROVED | REJECTED`
- `phone` nullable
- `created_at`
- `updated_at`

비고:

- `USER` 계정은 기본 승인 상태로 생성 가능
- `OWNER` 계정은 기본 `PENDING`으로 생성
- `ADMIN` 계정은 시드 또는 수동 생성

### 2. owner_profiles

목적: 점주 전용 사업자 정보 저장.

필드:

- `user_id` unique
- `business_name`
- `business_number`
- `approval_memo` nullable
- `approved_at` nullable
- `approved_by` nullable

### 3. shops

목적: 매장 기본 정보 저장.

필드:

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

목적: 매장 이미지 갤러리 정렬 저장.

필드:

- `id`
- `shop_id`
- `image_url`
- `sort_order`

### 5. shop_courses

목적: 매장 코스/가격 정보 저장.

필드:

- `id`
- `shop_id`
- `name`
- `duration_minutes`
- `price`
- `description` nullable
- `sort_order`

### 6. reviews

목적: 일반 사용자의 매장 리뷰 저장.

필드:

- `id`
- `shop_id`
- `user_id`
- `rating`
- `content`
- `created_at`

규칙:

- 로그인한 사용자만 작성 가능
- 한 사용자당 한 매장 1개 리뷰 제한은 추후 추가 가능

### 7. qna

목적: 전체 또는 매장별 질문과 관리자 답변 저장.

필드:

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

목적: 관리자 공지사항 저장.

필드:

- `id`
- `title`
- `content`
- `is_pinned`
- `created_by`
- `created_at`
- `updated_at`

### 9. audit_logs

목적: 관리자/점주 주요 액션 추적.

필드:

- `id`
- `actor_user_id`
- `action`
- `target_type`
- `target_id`
- `payload` JSON nullable
- `created_at`

권장 사용처:

- 점주 승인 / 반려
- 매장 노출 상태 변경
- 프리미엄 순서 변경
- 공지 수정

## API 설계

## 인증

### `POST /api/auth/register/user`

일반회원 계정 생성.

요청값:

- `name`
- `email`
- `password`

응답:

- 생성된 사용자 요약 정보

### `POST /api/auth/register/owner`

승인 대기 상태의 점주 계정 생성.

요청값:

- `name`
- `email`
- `password`
- `businessName`
- `businessNumber`
- `phone`

응답:

- 점주 신청 완료 결과

### `POST /api/auth/login`

사용자 인증 후 세션 생성.

규칙:

- 잘못된 자격 증명은 거부
- 승인되지 않은 점주 계정은 로그인 거부

### `POST /api/auth/logout`

세션 삭제.

### `GET /api/auth/me`

현재 로그인한 사용자 정보 반환.

## 매장

### `GET /api/shops`

공개 매장 목록 조회 API.

쿼리 파라미터:

- `region`
- `subRegion`
- `theme`
- `q`
- `page`
- `pageSize`

응답:

- 프리미엄 매장 목록
- 일반 매장 목록
- 페이지네이션 메타데이터

### `GET /api/shops/:slug`

공개 매장 상세 조회 API.

응답:

- 매장 기본 정보
- 이미지 갤러리
- 코스 목록
- 최근 리뷰

### `POST /api/owner/shops`

승인 완료된 점주의 매장 생성.

### `PATCH /api/owner/shops/:id`

점주 본인 매장 수정.

규칙:

- 점주는 자신이 소유한 매장만 수정 가능
- 관리자는 별도 관리자 API에서 수정 처리

### `GET /api/owner/shops/me`

현재 점주가 소유한 매장 조회.

### `PATCH /api/admin/shops/:id/visibility`

매장 노출 상태 변경.

### `PATCH /api/admin/shops/:id/premium`

프리미엄 여부 및 순서 변경.

## 승인 관리

### `GET /api/admin/approvals`

점주 승인 대기 / 처리 완료 목록 조회.

### `PATCH /api/admin/approvals/:userId/approve`

점주 승인 처리.

영향:

- 사용자 상태를 `APPROVED`로 변경
- 승인 메타데이터 저장
- 감사 로그 저장

### `PATCH /api/admin/approvals/:userId/reject`

점주 반려 처리.

영향:

- 사용자 상태를 `REJECTED`로 변경
- 감사 로그 저장

## 리뷰

### `GET /api/shops/:shopId/reviews`

매장 리뷰 목록 조회.

### `POST /api/shops/:shopId/reviews`

리뷰 작성.

규칙:

- 로그인 사용자만 작성 가능
- 평점 범위와 내용 길이 검증 필요

## Q&A

### `GET /api/qna`

전체 또는 매장별 Q&A 조회.

쿼리 파라미터:

- `shopId`

### `POST /api/qna`

질문 작성.

### `PATCH /api/admin/qna/:id/answer`

관리자 답변 등록 또는 수정.

## 공지

### `GET /api/notices`

공지 목록 조회.

### `GET /api/notices/:id`

공지 상세 조회.

### `POST /api/admin/notices`

공지 생성.

### `PATCH /api/admin/notices/:id`

공지 수정.

## 화면별 교체 대상

현재 목데이터 또는 클라이언트 전용 상태에 의존하는 화면은 아래와 같습니다.

### 공개 화면

- `/` -> `GET /api/shops`
- `/shop/[slug]` -> `GET /api/shops/:slug`
- `/board/qna` -> `GET /api/qna`, `POST /api/qna`
- `/board/review` -> 리뷰 조회 API
- `/board/notice` -> 공지 목록/상세 API

### 인증 화면

- `/auth/login` -> `POST /api/auth/login`
- `/auth/register/user` -> `POST /api/auth/register/user`
- `/auth/register-owner` -> `POST /api/auth/register/owner`

### 관리자 화면

- `/admin` -> 통계 집계 API
- `/admin/approvals` -> 승인 관리 API
- `/admin/shops` -> 관리자 매장 목록 / 노출 / 프리미엄 API
- `/admin/qna` -> 답변 관리 API
- `/admin/notice` -> 공지 CRUD API

## 단계별 구현 계획

### 1단계. 기반 세팅

- Prisma 추가
- PostgreSQL 연결
- 스키마 작성
- 첫 마이그레이션 생성
- 시드 데이터 구성
- 공용 DB 클라이언트 구성

완료 기준:

- 로컬 DB 기동 가능
- 마이그레이션 정상 수행
- 관리자/일반회원/점주/기본 매장 시드 적재 완료

### 2단계. 인증 및 권한

- 회원가입 API 구현
- 로그인/로그아웃/세션 구현
- `me` API 구현
- 역할별 가드 함수 구현
- 점주 승인 상태 검사 구현

완료 기준:

- 일반회원 가입 가능
- 점주 가입 가능
- 미승인 점주 로그인 차단
- 역할 기반 보호 동작

### 3단계. 매장 API

- 공개 매장 목록 구현
- 매장 상세 구현
- 점주 매장 생성/수정 구현
- 관리자 노출/프리미엄 변경 구현

완료 기준:

- 홈 화면이 DB 데이터 사용
- 상세 화면이 DB 데이터 사용
- 점주가 자기 매장 수정 가능
- 관리자 액션이 실제 저장됨

### 4단계. 커뮤니티 및 운영

- 리뷰 구현
- Q&A 구현
- 공지 구현
- 관리자 대시보드 집계 구현

완료 기준:

- Q&A 새로고침 후 유지
- 공지 새로고침 후 유지
- 리뷰 새로고침 후 유지
- 관리자 대시보드가 실제 수치 사용

### 5단계. 안정화

- 요청 검증 추가
- 감사 로그 추가
- 에러 처리 추가
- 페이지네이션 및 쿼리 안전성 보강
- 기본 테스트 추가
- 남은 목데이터 제거

완료 기준:

- 사용자 화면에서 `src/lib/mockData.ts` 의존 제거
- 쓰기 API에 검증 적용
- 중요 관리자 액션 로그 저장

## 우선순위

권장 구현 순서:

1. Prisma + PostgreSQL 세팅
2. 인증 + 역할 + 점주 승인
3. 매장 목록/상세 + 점주 매장 관리
4. 관리자 승인 + 관리자 매장 제어
5. Q&A + 공지 + 리뷰
6. 대시보드 통계 + 감사 로그 + 테스트

## 완료 정의

아래 조건을 모두 만족하면 백엔드 연동이 완료된 것으로 봅니다.

- 런타임 화면에서 목데이터 import 제거
- 데이터가 새로고침/재시작 후에도 유지
- 로그인 상태가 실제로 유지
- 관리자 / 점주 / 일반회원 권한 경계가 강제됨
- 점주 신청 -> 관리자 승인 -> 점주 로그인 -> 매장 수정 흐름이 끝까지 동작
- 관리자 노출/프리미엄 제어가 실제 저장
- Q&A, 공지, 리뷰가 DB에 저장
- 핵심 흐름에 대한 기본 검증 확보

## 현재 리스크

- 현재 mock 데이터의 한글 인코딩이 깨져 있으므로 시드 데이터로 그대로 옮기면 안 됨
- 현재 권한 로직은 UI에서 임시 처리 중이라 백엔드 도입 시 전면 교체 필요
- 프리미엄 순서 정책은 UI/API 확정 전에 비즈니스 규칙 정리가 필요
- 이미지 업로드/호스팅은 아직 설계되지 않았으므로 1차 범위에서 제외하는 편이 안전함

## 바로 다음 작업

다음 순서로 시작하는 것을 권장합니다.

1. Prisma 및 PostgreSQL 설정 추가
2. `prisma/schema.prisma` 생성
3. 첫 마이그레이션 생성
4. 관리자 1명, 점주 1명, 일반회원 1명, 기본 매장 데이터 시드 추가
5. 관리자 화면보다 먼저 인증 API부터 구현
