'use client';

import { useEffect, useMemo, useState } from 'react';

export function parseAdBody(body: string) {
  const phone = body.match(/(?:TEL|전화|연락처|대표번호)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '1588-0000';
  const email = body.match(/(?:E-mail|이메일|메일)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? 'ads@example.com';
  const kakao = body.match(/(?:Kakao|카카오톡|카톡|ID)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? 'ad_help';
  const hours = body.match(/(?:운영시간|업무시간|시간)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '평일 10:00 ~ 18:00 (토/일, 공휴일 휴무)';

  const mainBanner = body.match(/(?:메인 배너 광고|메인 배너)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '메인화면 최상단 영역에 고정적으로 노출되는 가장 주목도가 높은 상품입니다.';
  const categoryAd = body.match(/(?:카테고리 상단 광고|카테고리 상단)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '특정 업종이나 카테고리 검색 리스트 최상단에 배치되는 타겟 최적화 상품입니다.';
  const recomShop = body.match(/(?:추천업소 노출|추천업소|추천업체 노출|추천업체)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '리스트 내에서 추천 마크와 함께 노출 우선순위를 부여받는 실속형 상품입니다.';
  const popupAd = body.match(/(?:팝업 광고|팝업)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '사용자 접속 시 최초로 레이어로 화면 중앙에 노출되는 기간 한정 광고 상품입니다.';
  const bannerUrl = body.match(/(?:Image URL|배너 이미지|배너)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '';

  return { phone, email, kakao, hours, mainBanner, categoryAd, recomShop, popupAd, bannerUrl };
}

export function buildAdBody({
  phone,
  email,
  kakao,
  hours,
  mainBanner,
  categoryAd,
  recomShop,
  popupAd,
  bannerUrl,
}: {
  phone: string;
  email: string;
  kakao: string;
  hours: string;
  mainBanner: string;
  categoryAd: string;
  recomShop: string;
  popupAd: string;
  bannerUrl: string;
}) {
  return `## 광고 상품 안내
- 메인 배너 광고 : ${mainBanner}
- 카테고리 상단 광고 : ${categoryAd}
- 추천업체 노출 : ${recomShop}
- 팝업 광고 : ${popupAd}

## 진행 절차
광고 문의 접수 후 담당자가 상품 구성, 일정, 비용, 노출 조건을 안내하며 협의 완료 후 진행됩니다.
- 광고 집행 전 업소 정보와 소재 검수가 진행될 수 있습니다.
- 허위, 과장, 법령 위반 소지가 있는 광고 문구는 제한될 수 있습니다.

## 문의 및 연락처
- TEL : ${phone}
- E-mail : ${email}
- Kakao ID : ${kakao}
- 운영시간 : ${hours}
- Image URL : ${bannerUrl}`;
}

export function AdCustomEditor({
  body,
  onChange,
  ipt,
  lbl,
}: {
  body: string;
  onChange: (newBody: string) => void;
  ipt: string;
  lbl: string;
}) {
  const parsed = useMemo(() => parseAdBody(body), [body]);

  const [phone, setPhone] = useState(parsed.phone);
  const [email, setEmail] = useState(parsed.email);
  const [kakao, setKakao] = useState(parsed.kakao);
  const [hours, setHours] = useState(parsed.hours);
  const [mainBanner, setMainBanner] = useState(parsed.mainBanner);
  const [categoryAd, setCategoryAd] = useState(parsed.categoryAd);
  const [recomShop, setRecomShop] = useState(parsed.recomShop);
  const [popupAd, setPopupAd] = useState(parsed.popupAd);
  const [bannerUrl, setBannerUrl] = useState(parsed.bannerUrl);

  useEffect(() => {
    setPhone(parsed.phone);
    setEmail(parsed.email);
    setKakao(parsed.kakao);
    setHours(parsed.hours);
    setMainBanner(parsed.mainBanner);
    setCategoryAd(parsed.categoryAd);
    setRecomShop(parsed.recomShop);
    setPopupAd(parsed.popupAd);
    setBannerUrl(parsed.bannerUrl);
  }, [parsed]);

  const triggerChange = (fields: Partial<typeof parsed>) => {
    const updated = {
      phone,
      email,
      kakao,
      hours,
      mainBanner,
      categoryAd,
      recomShop,
      popupAd,
      bannerUrl,
      ...fields,
    };
    onChange(buildAdBody(updated));
  };

  return (
    <div className="space-y-5 rounded-xl border border-amber-100 bg-amber-50/20 p-5">
      <div className="mb-3 border-b border-amber-200 pb-2">
        <span className="text-sm font-bold text-amber-950">📢 광고 안내 상세 속성 설정</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={lbl}>대표 전화번호 (TEL)</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              triggerChange({ phone: e.target.value });
            }}
            className={ipt}
            placeholder="예: 1588-0000"
          />
        </div>
        <div>
          <label className={lbl}>비즈니스 이메일 (E-mail)</label>
          <input
            type="text"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              triggerChange({ email: e.target.value });
            }}
            className={ipt}
            placeholder="예: ads@example.com"
          />
        </div>
        <div>
          <label className={lbl}>카카오톡 ID (Kakao ID)</label>
          <input
            type="text"
            value={kakao}
            onChange={(e) => {
              setKakao(e.target.value);
              triggerChange({ kakao: e.target.value });
            }}
            className={ipt}
            placeholder="예: ad_help"
          />
        </div>
        <div>
          <label className={lbl}>운영시간 안내 (Office Hours)</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              triggerChange({ hours: e.target.value });
            }}
            className={ipt}
            placeholder="예: 평일 10:00 ~ 18:00"
          />
        </div>
      </div>

      <div>
        <label className={lbl}>배너 이미지 URL (Banner Hero Background)</label>
        <input
          type="text"
          value={bannerUrl}
          onChange={(e) => {
            setBannerUrl(e.target.value);
            triggerChange({ bannerUrl: e.target.value });
          }}
          className={ipt}
          placeholder="예: /images/ad-hero.jpg 또는 Unsplash 외부 이미지 링크"
        />
      </div>

      <hr className="my-4 border-amber-100" />

      <div className="space-y-4">
        <div>
          <label className={lbl}>1. 메인 배너 광고 안내</label>
          <textarea
            rows={2}
            value={mainBanner}
            onChange={(e) => {
              setMainBanner(e.target.value);
              triggerChange({ mainBanner: e.target.value });
            }}
            className={ipt}
            placeholder="메인 배너 광고 설명을 입력하세요."
          />
        </div>
        <div>
          <label className={lbl}>2. 카테고리 상단 광고 안내</label>
          <textarea
            rows={2}
            value={categoryAd}
            onChange={(e) => {
              setCategoryAd(e.target.value);
              triggerChange({ categoryAd: e.target.value });
            }}
            className={ipt}
            placeholder="카테고리 상단 광고 설명을 입력하세요."
          />
        </div>
        <div>
          <label className={lbl}>3. 추천업소 노출 안내</label>
          <textarea
            rows={2}
            value={recomShop}
            onChange={(e) => {
              setRecomShop(e.target.value);
              triggerChange({ recomShop: e.target.value });
            }}
            className={ipt}
            placeholder="추천업소 노출 설명을 입력하세요."
          />
        </div>
        <div>
          <label className={lbl}>4. 팝업 광고 안내</label>
          <textarea
            rows={2}
            value={popupAd}
            onChange={(e) => {
              setPopupAd(e.target.value);
              triggerChange({ popupAd: e.target.value });
            }}
            className={ipt}
            placeholder="팝업 광고 설명을 입력하세요."
          />
        </div>
      </div>
    </div>
  );
}
