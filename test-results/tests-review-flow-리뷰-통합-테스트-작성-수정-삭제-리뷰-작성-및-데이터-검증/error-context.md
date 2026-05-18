# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\review-flow.spec.ts >> 리뷰 통합 테스트 (작성/수정/삭제) >> 리뷰 작성 및 데이터 검증
- Location: tests\review-flow.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('김철수')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText('김철수')

```

```yaml
- banner:
  - text: 🎁 제휴업소 입점 문의 환영! | 프리미엄 배너 광고 진행중 | ☎ 1588-0000
  - link "힐 힐링찾기 HEALING DIRECTORY":
    - /url: /
  - combobox:
    - option "전체지역" [selected]
    - option "서울"
    - option "경기"
    - option "인천"
    - option "대구"
    - option "부산"
    - option "제주"
  - textbox "업소명, 테마 검색"
  - button
  - link "로그인":
    - /url: /auth/login
  - text: "|"
  - link "회원가입":
    - /url: /auth/register
  - list:
    - listitem:
      - link "지역별업소":
        - /url: /?view=list
    - listitem:
      - link "테마별업소":
        - /url: /?view=theme&region=seoul
    - listitem:
      - link "인기순위":
        - /url: /top100
    - listitem:
      - link "커뮤니티":
        - /url: /board
    - listitem:
      - link "고객센터":
        - /url: /board/qna
  - navigation:
    - link "서울":
      - /url: /?region=seoul
    - link "경기":
      - /url: /?region=gyeonggi
    - link "인천":
      - /url: /?region=incheon
    - link "대전":
      - /url: /?region=daejeon
    - link "대구":
      - /url: /?region=daegu
    - link "광주":
      - /url: /?region=gwangju
    - link "부산":
      - /url: /?region=busan
    - link "울산":
      - /url: /?region=ulsan
    - link "세종":
      - /url: /?region=sejong
    - link "강원":
      - /url: /?region=gangwon
    - link "충북":
      - /url: /?region=chungbuk
    - link "충남":
      - /url: /?region=chungnam
    - link "경북":
      - /url: /?region=gyeongbuk
    - link "경남":
      - /url: /?region=gyeongnam
    - link "전북":
      - /url: /?region=jeonbuk
    - link "전남":
      - /url: /?region=jeonnam
    - link "제주":
      - /url: /?region=jeju
    - link "스웨디시":
      - /url: /?view=theme&region=seoul&theme=swedish
    - link "아로마":
      - /url: /?view=theme&region=seoul&theme=aroma
    - link "타이":
      - /url: /?view=theme&region=seoul&theme=thai
    - link "스포츠":
      - /url: /?view=theme&region=seoul&theme=sport
    - link "딥티슈":
      - /url: /?view=theme&region=seoul&theme=deep
- main:
  - complementary:
    - link "📍 지역별 업소":
      - /url: /
    - link "전체보기":
      - /url: /
    - link "› 서울":
      - /url: /?region=seoul
    - link "› 경기":
      - /url: /?region=gyeonggi
    - link "› 인천":
      - /url: /?region=incheon
    - link "› 대전":
      - /url: /?region=daejeon
    - link "› 대구":
      - /url: /?region=daegu
    - link "› 광주":
      - /url: /?region=gwangju
    - link "› 부산":
      - /url: /?region=busan
    - link "› 울산":
      - /url: /?region=ulsan
    - link "› 세종":
      - /url: /?region=sejong
    - link "› 강원":
      - /url: /?region=gangwon
    - link "› 충북":
      - /url: /?region=chungbuk
    - link "› 충남":
      - /url: /?region=chungnam
    - link "› 경북":
      - /url: /?region=gyeongbuk
    - link "› 경남":
      - /url: /?region=gyeongnam
    - link "› 전북":
      - /url: /?region=jeonbuk
    - link "› 전남":
      - /url: /?region=jeonnam
    - link "› 제주":
      - /url: /?region=jeju
    - link "🏆 인기순위 (TOP 100)":
      - /url: /top100
    - link "› 주간 인기 추천업소":
      - /url: /top100
    - link "› 신규 등록 업소":
      - /url: /?sort=new
    - link "🏷️ 테마별 업소":
      - /url: /?view=theme
    - link "› 스웨디시":
      - /url: /?view=theme&theme=swedish
    - link "› 아로마":
      - /url: /?view=theme&theme=aroma
    - link "› 타이":
      - /url: /?view=theme&theme=thai
    - link "› 스포츠":
      - /url: /?view=theme&theme=sport
    - link "› 딥티슈":
      - /url: /?view=theme&theme=deep
    - link "› 핫스톤":
      - /url: /?view=theme&theme=hot_stone
    - link "› 발마사지":
      - /url: /?view=theme&theme=foot
    - link "› 커플":
      - /url: /?view=theme&theme=couple
    - link "📞 고객센터":
      - /url: /board/qna
    - link "› 공지사항":
      - /url: /board/notice
    - link "› Q&A 문의":
      - /url: /board/qna
    - link "› 업소 후기":
      - /url: /board/review
    - link "건마에반하다 광고 안내 바로가기 >":
      - /url: /board/notice
    - link "BUSINESS PARTNER 제휴 입점 문의 상담 신청하기 >":
      - /url: /board/partnership
    - text: 🎯 배너 슬롯 180×150
  - paragraph: 🔥 내 주변 최고의 힐링 업소 찾기
  - paragraph: 전국 500개+ 제휴업소 | 매일 업데이트되는 검증된 정보
  - button "새로고침"
  - text: 👑 PREMIUM 추천업소 광고 · 최대 4개
  - 'link "힐링 스파 서울본점 🌿 AD 힐링 스파 서울본점 강남 도심 속 프리미엄 스웨디시 케어 5.0 서울 #스웨디시 프리미엄 주차가능 카드환영 70000~"':
    - /url: /shop/healing-spa-seoul
    - img "힐링 스파 서울본점"
    - text: 🌿 AD
    - heading "힐링 스파 서울본점" [level=3]
    - paragraph: 강남 도심 속 프리미엄 스웨디시 케어
    - text: "5.0 서울 #스웨디시 프리미엄 주차가능 카드환영 70000~"
  - 'link "🙏 AD 부산 타이 스트레치 전통 타이 스트레칭과 회복 케어 4.9 부산 #타이 타이 스트레칭 커플환영 55000~"':
    - /url: /shop/busan-thai-stretch
    - text: 🙏 AD
    - heading "부산 타이 스트레치" [level=3]
    - paragraph: 전통 타이 스트레칭과 회복 케어
    - text: "4.9 부산 #타이 타이 스트레칭 커플환영 55000~"
  - 'link "🔥 AD 수원 딥케어 테라피 근육 피로를 푸는 딥티슈 전문 케어 4.6 경기 #딥티슈 딥티슈 무료주차 야간영업 68000~"':
    - /url: /shop/suwon-deep-care
    - text: 🔥 AD
    - heading "수원 딥케어 테라피" [level=3]
    - paragraph: 근육 피로를 푸는 딥티슈 전문 케어
    - text: "4.6 경기 #딥티슈 딥티슈 무료주차 야간영업 68000~"
  - 'link "🌸 AD 아로마 밸런스 홍대 조용한 아로마 케어와 편안한 휴식 4.7 서울 #아로마 아로마 예약제 카드환영 65000~"':
    - /url: /shop/aroma-balance-hongdae
    - text: 🌸 AD
    - heading "아로마 밸런스 홍대" [level=3]
    - paragraph: 조용한 아로마 케어와 편안한 휴식
    - text: "4.7 서울 #아로마 아로마 예약제 카드환영 65000~"
  - text: 📋 전체 업소 · 전체 (1-30 / 46개)
  - button "카드형 보기"
  - button "리스트형 보기"
  - button "랜덤"
  - 'link "🔥 인천 딥티슈 샘플 37 인천 부평 #딥티슈딥티슈부평 4.1 65000~"':
    - /url: /shop/sample-healing-shop-37
    - text: 🔥
    - heading "인천 딥티슈 샘플 37" [level=3]
    - text: "인천 부평 #딥티슈딥티슈부평 4.1 65000~"
  - 'link "🦶 광주 풋케어 샘플 23 광주 서구 #풋케어풋케어서구 4.5 75000~"':
    - /url: /shop/sample-healing-shop-23
    - text: 🦶
    - heading "광주 풋케어 샘플 23" [level=3]
    - text: "광주 서구 #풋케어풋케어서구 4.5 75000~"
  - 'link "🌿 전남 스웨디시 샘플 33 전남 여수 #스웨디시스웨디시여수 4.6 45000~"':
    - /url: /shop/sample-healing-shop-33
    - text: 🌿
    - heading "전남 스웨디시 샘플 33" [level=3]
    - text: "전남 여수 #스웨디시스웨디시여수 4.6 45000~"
  - 'link "🔥 충남 딥티슈 샘플 29 충남 천안 #딥티슈딥티슈천안 4.2 65000~"':
    - /url: /shop/sample-healing-shop-29
    - text: 🔥
    - heading "충남 딥티슈 샘플 29" [level=3]
    - text: "충남 천안 #딥티슈딥티슈천안 4.2 65000~"
  - 'link "💪 충북 스포츠 샘플 28 충북 청주 #스포츠스포츠청주 4.1 60000~"':
    - /url: /shop/sample-healing-shop-28
    - text: 💪
    - heading "충북 스포츠 샘플 28" [level=3]
    - text: "충북 청주 #스포츠스포츠청주 4.1 60000~"
  - 'link "🔥 대전 딥티슈 샘플 21 대전 서구 #딥티슈딥티슈서구 4.3 65000~"':
    - /url: /shop/sample-healing-shop-21
    - text: 🔥
    - heading "대전 딥티슈 샘플 21" [level=3]
    - text: "대전 서구 #딥티슈딥티슈서구 4.3 65000~"
  - 'link "🌸 서울 아로마 샘플 18 서울 강남 #아로마아로마강남 4.9 50000~"':
    - /url: /shop/sample-healing-shop-18
    - text: 🌸
    - heading "서울 아로마 샘플 18" [level=3]
    - text: "서울 강남 #아로마아로마강남 4.9 50000~"
  - 'link "🌿 울산 스웨디시 샘플 25 울산 남구 #스웨디시스웨디시남구 4.7 45000~"':
    - /url: /shop/sample-healing-shop-25
    - text: 🌿
    - heading "울산 스웨디시 샘플 25" [level=3]
    - text: "울산 남구 #스웨디시스웨디시남구 4.7 45000~"
  - 'link "👫 전북 커플 샘플 32 전북 전주 #커플커플전주 4.5 80000~"':
    - /url: /shop/sample-healing-shop-32
    - text: 👫
    - heading "전북 커플 샘플 32" [level=3]
    - text: "전북 전주 #커플커플전주 4.5 80000~"
  - 'link "💎 대구 핫스톤 샘플 22 대구 중구 #핫스톤핫스톤중구 4.4 70000~"':
    - /url: /shop/sample-healing-shop-22
    - text: 💎
    - heading "대구 핫스톤 샘플 22" [level=3]
    - text: "대구 중구 #핫스톤핫스톤중구 4.4 70000~"
  - 'link "🙏 강원 타이 샘플 27 강원 춘천 #타이타이춘천 4.9 55000~"':
    - /url: /shop/sample-healing-shop-27
    - text: 🙏
    - heading "강원 타이 샘플 27" [level=3]
    - text: "강원 춘천 #타이타이춘천 4.9 55000~"
  - 'link "🙏 서울 타이 샘플 35 서울 강남 #타이타이강남 4.8 55000~"':
    - /url: /shop/sample-healing-shop-35
    - text: 🙏
    - heading "서울 타이 샘플 35" [level=3]
    - text: "서울 강남 #타이타이강남 4.8 55000~"
  - 'link "💎 경북 핫스톤 샘플 30 경북 포항 #핫스톤핫스톤포항 4.3 70000~"':
    - /url: /shop/sample-healing-shop-30
    - text: 💎
    - heading "경북 핫스톤 샘플 30" [level=3]
    - text: "경북 포항 #핫스톤핫스톤포항 4.3 70000~"
  - 'link "🦶 경남 풋케어 샘플 31 경남 창원 #풋케어풋케어창원 4.4 75000~"':
    - /url: /shop/sample-healing-shop-31
    - text: 🦶
    - heading "경남 풋케어 샘플 31" [level=3]
    - text: "경남 창원 #풋케어풋케어창원 4.4 75000~"
  - 'link "🌸 제주 아로마 샘플 34 제주 제주 #아로마아로마제주 4.7 50000~"':
    - /url: /shop/sample-healing-shop-34
    - text: 🌸
    - heading "제주 아로마 샘플 34" [level=3]
    - text: "제주 제주 #아로마아로마제주 4.7 50000~"
  - 'link "👫 광주 커플 샘플 40 광주 서구 #커플커플서구 4.4 80000~"':
    - /url: /shop/sample-healing-shop-40
    - text: 👫
    - heading "광주 커플 샘플 40" [level=3]
    - text: "광주 서구 #커플커플서구 4.4 80000~"
  - 'link "💎 대전 핫스톤 샘플 38 대전 서구 #핫스톤핫스톤서구 4.2 70000~"':
    - /url: /shop/sample-healing-shop-38
    - text: 💎
    - heading "대전 핫스톤 샘플 38" [level=3]
    - text: "대전 서구 #핫스톤핫스톤서구 4.2 70000~"
  - 'link "🌿 부산 스웨디시 샘플 41 부산 해운대 #스웨디시스웨디시해운대 4.5 45000~"':
    - /url: /shop/sample-healing-shop-41
    - text: 🌿
    - heading "부산 스웨디시 샘플 41" [level=3]
    - text: "부산 해운대 #스웨디시스웨디시해운대 4.5 45000~"
  - 'link "🌸 세종 아로마 샘플 26 세종 세종 #아로마아로마세종 4.8 50000~"':
    - /url: /shop/sample-healing-shop-26
    - text: 🌸
    - heading "세종 아로마 샘플 26" [level=3]
    - text: "세종 세종 #아로마아로마세종 4.8 50000~"
  - 'link "💪 인천 스포츠 샘플 20 인천 부평 #스포츠스포츠부평 4.2 60000~"':
    - /url: /shop/sample-healing-shop-20
    - text: 💪
    - heading "인천 스포츠 샘플 20" [level=3]
    - text: "인천 부평 #스포츠스포츠부평 4.2 60000~"
  - 'link "🦶 대구 풋케어 샘플 39 대구 중구 #풋케어풋케어중구 4.3 75000~"':
    - /url: /shop/sample-healing-shop-39
    - text: 🦶
    - heading "대구 풋케어 샘플 39" [level=3]
    - text: "대구 중구 #풋케어풋케어중구 4.3 75000~"
  - 'link "👫 부산 커플 샘플 24 부산 해운대 #커플커플해운대 4.6 80000~"':
    - /url: /shop/sample-healing-shop-24
    - text: 👫
    - heading "부산 커플 샘플 24" [level=3]
    - text: "부산 해운대 #커플커플해운대 4.6 80000~"
  - 'link "💪 경기 스포츠 샘플 36 경기 수원 #스포츠스포츠수원 4.9 60000~"':
    - /url: /shop/sample-healing-shop-36
    - text: 💪
    - heading "경기 스포츠 샘플 36" [level=3]
    - text: "경기 수원 #스포츠스포츠수원 4.9 60000~"
  - 'link "🙏 경기 타이 샘플 19 경기 수원 #타이타이수원 4.1 55000~"':
    - /url: /shop/sample-healing-shop-19
    - text: 🙏
    - heading "경기 타이 샘플 19" [level=3]
    - text: "경기 수원 #타이타이수원 4.1 55000~"
  - navigation "페이지네이션":
    - button "1"
    - button "2"
    - button "다음"
  - heading "힐링찾기 - 전국 마사지·힐링업소 디렉토리" [level=1]
  - paragraph: 힐링찾기는 전국 마사지·힐링 제휴업소를 지역별·테마별로 한눈에 비교할 수 있는 디렉토리 플랫폼입니다. 서울, 경기, 부산 등 전국 주요 도시의 검증된 업소를 소개합니다.
  - heading "지역별 마사지 업소 찾기" [level=2]
  - paragraph: 강남, 홍대, 해운대 등 인기 지역부터 수원, 인천, 대전까지 다양한 지역의 업소를 손쉽게 검색하세요. 스웨디시, 아로마, 타이, 스포츠 마사지 등 테마별 필터로 원하는 업소를 빠르게 찾을 수 있습니다.
  - heading "프리미엄 추천업소" [level=2]
  - paragraph: 매일 업데이트되는 프리미엄 추천업소를 통해 최고 수준의 서비스를 경험하세요. 업소 상세 페이지에서 코스 정보, 요금표, 실제 방문 후기를 확인할 수 있습니다.
- contentinfo:
  - link "광고안내":
    - /url: /ad
  - text: "|"
  - link "이용약관":
    - /url: /terms
  - text: "|"
  - link "개인정보처리방침":
    - /url: /privacy
  - text: "|"
  - link "청소년보호정책":
    - /url: /youth
  - text: "|"
  - link "모바일웹":
    - /url: /mobile
  - text: "|"
  - link "RSS":
    - /url: /rss
  - text: 힐 힐링찾기 ENTERPRISE DIRECTORY
  - paragraph: "힐링찾기 | 대표자: 홍길동 | 사업자번호: 000-00-00000 | 서울특별시 강남구 테헤란로 123"
  - paragraph: Copyright © 2026 힐링찾기. All rights reserved.
  - heading "고객센터" [level=3]
  - text: 1588-0000
  - paragraph: "평일 : 월~금 09:00 ~ 18:00"
  - paragraph: "점심시간 : 12:00 ~ 13:30 (주말, 공휴일 휴무)"
  - paragraph: "E-MAIL : help@healing.co.kr"
  - link "YT":
    - /url: "#"
  - link "IG":
    - /url: "#"
  - link "BL":
    - /url: "#"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('리뷰 통합 테스트 (작성/수정/삭제)', () => {
  4  |   const TEST_SHOP_URL = 'http://localhost:3000/shop/healing-spa-seoul';
  5  |   const TEST_CONTENT = '플레이라이트 자동화 테스트 리뷰입니다. ' + new Date().getTime();
  6  |   const UPDATED_CONTENT = '수정된 테스트 내용입니다. ' + new Date().getTime();
  7  | 
  8  |   test('리뷰 작성 및 데이터 검증', async ({ page }) => {
  9  |     // 1. 로그인 페이지 이동 및 로그인
  10 |     console.log('🚀 로그인 페이지 이동 중...');
  11 |     await page.goto('http://localhost:3000/auth/login');
  12 |     
  13 |     await page.fill('input[placeholder="아이디"]', 'user@massage.local');
  14 |     await page.fill('input[placeholder="비밀번호"]', 'user1234');
  15 |     
  16 |     console.log('🚀 로그인 버튼 클릭...');
  17 |     await page.click('button[type="submit"]');
  18 | 
  19 |     // 로그인 완료 및 세션 반영 대기 (헤더의 사용자 이름 확인)
  20 |     console.log('🔍 로그인 세션 반영 대기 중...');
> 21 |     await expect(page.getByText('김철수')).toBeVisible({ timeout: 20000 });
     |                                         ^ Error: expect(locator).toBeVisible() failed
  22 |     console.log('✅ 로그인 확인 완료 (김철수님)');
  23 | 
  24 |     // 2. 상점 상세 페이지 이동
  25 |     console.log('🚀 상세 페이지 이동 중...');
  26 |     await page.goto(TEST_SHOP_URL);
  27 |     
  28 |     // 페이지 로딩 및 세션 체크 대기
  29 |     await page.waitForLoadState('networkidle');
  30 | 
  31 |     // 3. 리뷰 입력 폼 활성화
  32 |     console.log('🔍 리뷰 폼 활성화 대기...');
  33 |     const placeholder = page.locator('text=방문 후기를 남겨주세요...');
  34 |     
  35 |     // 로그인이 안 된 상태의 메시지가 떠있다면 사라질 때까지 대기
  36 |     const loginRequiredMsg = page.locator('text=후기를 작성하려면 로그인이 필요합니다.');
  37 |     if (await loginRequiredMsg.isVisible()) {
  38 |       console.log('⏳ 로그인 정보 로딩 대기 중...');
  39 |       await expect(loginRequiredMsg).not.toBeVisible({ timeout: 15000 });
  40 |     }
  41 | 
  42 |     await placeholder.waitFor({ state: 'visible', timeout: 10000 });
  43 |     await placeholder.click();
  44 |     
  45 |     // 4. 리뷰 내용 입력 및 등록
  46 |     console.log('✍️ 리뷰 내용 입력 중...');
  47 |     await page.fill('textarea', TEST_CONTENT);
  48 |     await page.click('button:has-text("후기 등록")');
  49 | 
  50 |     // 5. 등록 확인
  51 |     console.log('🔍 등록된 리뷰 확인 중...');
  52 |     await expect(page.locator(`text=${TEST_CONTENT}`)).toBeVisible({ timeout: 10000 });
  53 |     console.log('✅ 리뷰 작성 및 노출 확인 완료');
  54 | 
  55 |     // --- API 기반 수정/삭제 검증 ---
  56 |     console.log('🛠️ API 기반 수정/삭제 검증 시작...');
  57 |     
  58 |     const reviewId = await page.evaluate(async (content) => {
  59 |       const res = await fetch('/api/board/reviews');
  60 |       const data = await res.json();
  61 |       const myReview = data.reviews.find((r: any) => r.content === content);
  62 |       return myReview?.id;
  63 |     }, TEST_CONTENT);
  64 | 
  65 |     if (!reviewId) throw new Error('작성된 리뷰의 ID를 찾을 수 없습니다.');
  66 |     console.log(`🔍 생성된 리뷰 ID: ${reviewId}`);
  67 | 
  68 |     // 6. 리뷰 수정
  69 |     const patchRes = await page.evaluate(async ({ id, content }) => {
  70 |       const res = await fetch(`/api/board/reviews/${id}`, {
  71 |         method: 'PATCH',
  72 |         headers: { 'Content-Type': 'application/json' },
  73 |         body: JSON.stringify({ content, rating: 4 })
  74 |       });
  75 |       return res.ok;
  76 |     }, { id: reviewId, content: UPDATED_CONTENT });
  77 | 
  78 |     expect(patchRes).toBe(true);
  79 |     await page.reload();
  80 |     await expect(page.locator(`text=${UPDATED_CONTENT}`)).toBeVisible();
  81 |     console.log('✅ 리뷰 수정 및 반영 확인 완료');
  82 | 
  83 |     // 7. 리뷰 삭제
  84 |     const deleteRes = await page.evaluate(async (id) => {
  85 |       const res = await fetch(`/api/board/reviews/${id}`, {
  86 |         method: 'DELETE'
  87 |       });
  88 |       return res.ok;
  89 |     }, reviewId);
  90 | 
  91 |     expect(deleteRes).toBe(true);
  92 |     await page.reload();
  93 |     await expect(page.locator(`text=${UPDATED_CONTENT}`)).not.toBeVisible();
  94 |     console.log('✅ 리뷰 삭제 및 반영 확인 완료');
  95 |   });
  96 | });
  97 | 
```