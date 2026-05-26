'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Layers,
  Sparkles,
  Smartphone,
  Tv,
  MessageSquare,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Monitor,
  MousePointerClick
} from 'lucide-react';
import type { ResolvedLegalDocument } from '@/lib/legal-documents';

type Props = {
  document: ResolvedLegalDocument;
};

export default function AdvertisingPageClient({ document }: Props) {
  // Parse contact info from the document sections using smart regex
  const parsedContact = useMemo(() => {
    let phone = '1588-0000';
    let email = 'ads@example.com';
    let kakao = 'ad_help';
    let hours = '평일 10:00 ~ 18:00 (토/일, 공휴일 휴무)';

    // Search in all sections for lines containing contact terms
    document.sections.forEach((section) => {
      const allLines = [...section.paragraphs, ...(section.items ?? [])];
      allLines.forEach((line) => {
        const phoneMatch = line.match(/(?:TEL|전화|연락처|대표번호)\s*[:：]\s*([^\n]+)/i);
        const emailMatch = line.match(/(?:E-mail|이메일|메일)\s*[:：]\s*([^\n]+)/i);
        const kakaoMatch = line.match(/(?:Kakao|카카오톡|카톡|ID)\s*[:：]\s*([^\n]+)/i);
        const hoursMatch = line.match(/(?:운영시간|업무시간|시간)\s*[:：]\s*([^\n]+)/i);

        if (phoneMatch) phone = phoneMatch[1].trim();
        if (emailMatch) email = emailMatch[1].trim();
        if (kakaoMatch) kakao = kakaoMatch[1].trim();
        if (hoursMatch) hours = hoursMatch[1].trim();
      });
    });

    return { phone, email, kakao, hours };
  }, [document]);

  // Parse banner background URL dynamically
  const bannerUrl = useMemo(() => {
    let url = '';
    document.sections.forEach((section) => {
      const allLines = [...section.paragraphs, ...(section.items ?? [])];
      allLines.forEach((line) => {
        const bannerMatch = line.match(/(?:Image URL|배너 이미지|배너)\s*[:：]\s*([^\n]+)/i);
        if (bannerMatch) url = bannerMatch[1].trim();
      });
    });
    return url;
  }, [document]);

  // Parse dynamic descriptions of products
  const productTexts = useMemo(() => {
    let mainBanner = '메인화면 최상단 영역에 고정적으로 노출되는 가장 주목도가 높은 상품입니다.';
    let categoryAd = '특정 업종이나 카테고리 검색 리스트 최상단에 배치되는 타겟 최적화 상품입니다.';
    let recomShop = '리스트 내에서 추천 마크와 함께 노출 우선순위를 부여받는 실속형 상품입니다.';
    let popupAd = '사용자 접속 시 최초로 레이어로 화면 중앙에 노출되는 기간 한정 광고 상품입니다.';

    document.sections.forEach((section) => {
      const allLines = [...section.paragraphs, ...(section.items ?? [])];
      allLines.forEach((line) => {
        const mainMatch = line.match(/(?:메인 배너 광고|메인 배너)\s*[:：]\s*([^\n]+)/);
        const categoryMatch = line.match(/(?:카테고리 상단 광고|카테고리 상단)\s*[:：]\s*([^\n]+)/);
        const recomMatch = line.match(/(?:추천업소 노출|추천업소|추천업체 노출|추천업체)\s*[:：]\s*([^\n]+)/);
        const popupMatch = line.match(/(?:팝업 광고|팝업)\s*[:：]\s*([^\n]+)/);

        if (mainMatch) mainBanner = mainMatch[1].trim();
        if (categoryMatch) categoryAd = categoryMatch[1].trim();
        if (recomMatch) recomShop = recomMatch[1].trim();
        if (popupMatch) popupAd = popupMatch[1].trim();
      });
    });

    return { mainBanner, categoryAd, recomShop, popupAd };
  }, [document]);

  // Split notice list from note field
  const notices = useMemo(() => {
    if (!document.note?.trim()) {
      return [
        '광고 소재는 내부 규격 가이드 검수 후 등록 처리됩니다.',
        '불법, 퇴폐, 허위 정보가 포함된 광고는 사전 예고 없이 게재가 제한될 수 있습니다.',
        '광고 배너 위치 지정은 청약 계약 순서에 의거하여 순차 배치됩니다.',
        '중도 해지 및 환불 규정은 당사 이용약관 및 서비스 표준 청약 규정을 따릅니다.'
      ];
    }
    return document.note
      .split('\n')
      .map((line) => line.replace(/^[-*•\s]+/, '').trim())
      .filter(Boolean);
  }, [document.note]);

  // Default step configuration
  const steps = [
    { num: '01', title: '광고 문의', desc: '온라인 접수 및 채널 상담', icon: MessageSquare },
    { num: '02', title: '상품 상담', desc: '노출 기간 및 위치 견적 협의', icon: Layers },
    { num: '03', title: '소재 전달', desc: '배너 디자인 및 문구 접수', icon: Tv },
    { num: '04', title: '내부 검수', desc: '소재 가이드 및 규격 최종 확인', icon: ShieldCheck },
    { num: '05', title: '광고 시작', desc: '스케줄러 기반 정식 라이브', icon: CheckCircle2 }
  ];

  // Map products
  const products = [
    {
      title: '메인 배너 광고',
      desc: productTexts.mainBanner,
      badge: '인지도 극대화',
      features: ['PC / 모바일 동시 고정 노출', '유니크 브랜드 배너 적용', '클릭율 최상위 기록'],
      icon: Megaphone,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50'
    },
    {
      title: '카테고리 상단 광고',
      desc: productTexts.categoryAd,
      badge: '타겟 세분화',
      features: ['지역 기반 타겟 노출 가능', '리스트 스크롤 시작점 배치', '실수요 고객 타겟팅'],
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: '추천업소 노출',
      desc: productTexts.recomShop,
      badge: '선호도 상승',
      features: ['목록 우선 배치 우선권', '추천 뱃지 자동 부여', '가성비 최우수 추천 상품'],
      icon: Sparkles,
      color: 'from-rose-500 to-pink-600',
      bgLight: 'bg-rose-50'
    },
    {
      title: '팝업 광고',
      desc: productTexts.popupAd,
      badge: '단기 프로모션',
      features: ['이벤트 및 신규 오픈 알림', '일별 무제한 팝업 호출', '정교한 기간 스케줄 관리'],
      icon: Smartphone,
      color: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50'
    }
  ];

  // Map locations
  const locations = [
    { title: '메인페이지', desc: '첫 방문 시 상단 최우선 주목 영역', icon: Monitor },
    { title: '카테고리 리스트', desc: '검색 필터 결과 최상단 고정', icon: Layers },
    { title: '상세페이지', desc: '개별 업소 상세 프로필 하단 고정', icon: Tv },
    { title: '모바일 메인', desc: '스마트폰 화면 최적화 전용 배너', icon: Smartphone },
    { title: '팝업 영역', desc: '랜딩 시 시선을 잡는 레이어 팝업', icon: MousePointerClick }
  ];

  return (
    <div className="mx-auto max-w-[900px] px-3 py-6 space-y-10">
      {/* 경로안내 */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-[var(--portal-brand)] transition-colors">홈</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-bold">광고안내</span>
      </div>

      {/* 히어로 타이틀 */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--portal-brand-dark)] via-[var(--portal-brand-hover)] to-[var(--portal-brand)] p-8 text-center text-white shadow-xl sm:p-12 bg-cover bg-center"
        style={bannerUrl ? { backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url('${bannerUrl}')` } : undefined}
      >
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        
        <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-amber-300 backdrop-blur-sm mb-4">
          {document.eyebrow || 'Advertising Guide'}
        </span>
        <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
          {document.title}
        </h1>
        <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-amber-400" />
        <p className="mx-auto max-w-xl text-sm leading-relaxed opacity-90 sm:text-base whitespace-pre-line">
          {document.description}
        </p>
      </div>

      {/* 광고 상품 섹션 */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-800 sm:text-2xl">프리미엄 광고 상품</h2>
          <p className="text-xs text-gray-400 mt-1">업체 성격과 홍보 전략에 따라 알맞은 광고 상품을 선택해보세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {products.map((product, idx) => {
            const Icon = product.icon;
            return (
              <div
                key={idx}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`rounded-xl bg-gradient-to-r ${product.color} p-3 text-white shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full ${product.bgLight} px-3 py-1 text-xs font-black text-gray-700`}>
                      {product.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-gray-800 group-hover:text-[var(--portal-brand)] transition-colors">
                    {product.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {product.desc}
                  </p>
                </div>
                <div className="mt-6 border-t border-gray-50 pt-4">
                  <ul className="space-y-1.5">
                    {product.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 광고 노출 위치 안내 */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800 sm:text-xl">📍 확실한 광고 노출 위치</h2>
          <p className="text-xs text-gray-400 mt-0.5">이용자 구매 결정의 핵심 터치포인트 영역에 고정 노출됩니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {locations.map((loc, idx) => {
            const Icon = loc.icon;
            return (
              <div key={idx} className="flex flex-col items-center p-3 text-center rounded-xl bg-gray-50 hover:bg-gray-100/50 transition">
                <div className="rounded-full bg-white p-2.5 shadow-sm text-[var(--portal-brand)] mb-2.5">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-gray-700 mb-1">{loc.title}</h4>
                <p className="text-[10px] text-gray-400 leading-tight">{loc.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 광고 진행 절차 */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800 sm:text-xl">⚡ 빠르고 간편한 광고 진행 절차</h2>
          <p className="text-xs text-gray-400 mt-0.5">상담부터 라이브까지 원스톱으로 지원합니다.</p>
        </div>

        {/* 가로 진행 단계형 UI (모바일에서는 세로로 자동 정렬) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
                <span className="absolute left-3 top-3 text-[10px] font-black text-gray-300 tracking-wider">
                  {step.num}
                </span>
                <div className="rounded-full bg-red-50 p-3 text-red-600 mb-3 mt-1.5">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-black text-gray-800 mb-1">{step.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">{step.desc}</p>
                
                {/* 화살표 가이드 (데스크톱 전용) */}
                {idx < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 z-10 rounded-full bg-white border border-gray-100 p-1 text-gray-300 shadow-sm">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 광고 문의 영역 (강조 박스 UI) */}
      <section className="overflow-hidden rounded-3xl border border-red-100 bg-red-50/50 shadow-sm">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-black">📞 광고 제휴 제안 및 상담 예약</h3>
            <p className="text-xs text-red-100 mt-0.5">담당 영업부서로 연락해주시면 맞춤 상품을 정성껏 설계해 드립니다.</p>
          </div>
          <Link
            href="/board/partnership"
            className="shrink-0 text-center rounded-xl bg-white px-5 py-2 text-xs font-black text-red-600 shadow-md hover:bg-red-50 transition"
          >
            입점/제휴 문의 접수하기 &rsaquo;
          </Link>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-100 bg-white sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {/* 전화 및 이메일 */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-50 p-2.5 text-red-600">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Direct Phone</p>
                <p className="text-base font-black text-gray-800">{parsedContact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Business Email</p>
                <p className="text-sm font-black text-gray-800">{parsedContact.email}</p>
              </div>
            </div>
          </div>

          {/* 카카오 및 업무시간 */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-50 p-2.5 text-yellow-600 text-sm">
                💬
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Kakao Talk Support</p>
                <p className="text-sm font-black text-gray-800">@{parsedContact.kakao}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-50 p-2.5 text-gray-600">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Office Hours</p>
                <p className="text-xs font-bold text-gray-600">{parsedContact.hours}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 유의사항 박스 */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-2">
        <h4 className="text-xs font-black text-gray-700 flex items-center gap-1.5">
          ⚠️ 광고 집행 시 필수 유의사항
        </h4>
        <ul className="space-y-1">
          {notices.map((notice, idx) => (
            <li key={idx} className="text-[11px] leading-relaxed text-gray-500 flex items-start gap-1">
              <span className="text-red-500 mt-0.5 shrink-0">•</span>
              <span>{notice}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
