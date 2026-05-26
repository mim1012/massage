'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Eye, FileText, Globe, Info, Layout, RotateCcw, Save, Settings, Shield, Type } from 'lucide-react';
import {
  DEFAULT_LEGAL_DOCUMENTS,
  parseLegalDocumentBody,
  type EditableLegalDocument,
  type LegalDocumentSlug,
  type ResolvedLegalDocument,
} from '@/lib/legal-documents';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';
import {
  createDefaultAdminSettingsState,
  getAdminSettingsDirtyState,
  resetLegalDocumentToDefault,
  type AdminLegalDocumentState,
  type AdminSettingsBaseline,
} from './editor-state';

function formatUpdatedAt(value?: string | null) {
  if (!value) return '아직 저장 기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '저장 시각 확인 불가';

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function parseAdBody(body: string) {
  const phone = body.match(/(?:TEL|전화|연락처|대표번호)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '1588-0000';
  const email = body.match(/(?:E-mail|이메일|메일)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? 'ads@example.com';
  const kakao = body.match(/(?:Kakao|카카오톡|카톡|ID)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? 'ad_help';
  const hours = body.match(/(?:운영시간|업무시간|시간)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '평일 10:00 ~ 18:00 (토/일, 공휴일 휴무)';

  const mainBanner = body.match(/(?:메인 배너 광고|메인 배너)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '메인화면 최상단 영역에 고정적으로 노출되는 가장 주목도가 높은 상품입니다.';
  const categoryAd = body.match(/(?:카테고리 상단 광고|카테고리 상단)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '특정 업종이나 카테고리 검색 리스트 최상단에 배치되는 타겟 최적화 상품입니다.';
  const recomShop = body.match(/(?:추천업소 노출|추천업소)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '리스트 내에서 추천 마크와 함께 노출 우선순위를 부여받는 실속형 상품입니다.';
  const popupAd = body.match(/(?:팝업 광고|팝업)\s*[:：]\s*([^\n]+)/)?.[1]?.trim() ?? '사용자 접속 시 최초로 레이어로 화면 중앙에 노출되는 기간 한정 광고 상품입니다.';
  const bannerUrl = body.match(/(?:Image URL|배너 이미지|배너)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() ?? '';

  return { phone, email, kakao, hours, mainBanner, categoryAd, recomShop, popupAd, bannerUrl };
}

function buildAdBody({
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

function AdCustomEditor({
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
      <div className="border-b border-amber-200 pb-2 mb-3">
        <span className="text-sm font-bold text-amber-850">📢 광고 안내 상세 속성 설정</span>
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

      <hr className="border-amber-100 my-4" />

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

export default function AdminSettingsPage() {
  const [siteForm, setSiteForm] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [seoForm, setSeoForm] = useState<HomeSeoContent>(MOCK_HOME_SEO);
  const [legalDocs, setLegalDocs] = useState<Record<LegalDocumentSlug, AdminLegalDocumentState>>(DEFAULT_LEGAL_DOCUMENTS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLegalSaving, setIsLegalSaving] = useState<LegalDocumentSlug | null>(null);
  const [legalSaveMessage, setLegalSaveMessage] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);
  const [baseline, setBaseline] = useState<AdminSettingsBaseline | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ipt =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-[var(--portal-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-brand)]/20';
  const lbl = 'mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700';

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsResponse, legalResponse] = await Promise.all([
          fetch('/api/admin/settings', { cache: 'no-store' }),
          fetch('/api/admin/legal-documents', { cache: 'no-store' }),
        ]);

        if (settingsResponse.ok) {
          const result = (await settingsResponse.json()) as { siteSettings?: SiteSettings; homeSeo?: HomeSeoContent };
          if (result.siteSettings && result.homeSeo) {
            setSiteForm(result.siteSettings);
            setSeoForm(result.homeSeo);

            if (legalResponse.ok) {
              const legalResult = (await legalResponse.json()) as Partial<Record<LegalDocumentSlug, ResolvedLegalDocument>>;
              const mergedLegalDocs = {
                privacy: { ...DEFAULT_LEGAL_DOCUMENTS.privacy, ...legalResult.privacy },
                terms: { ...DEFAULT_LEGAL_DOCUMENTS.terms, ...legalResult.terms },
                youth: { ...DEFAULT_LEGAL_DOCUMENTS.youth, ...legalResult.youth },
                ad: { ...DEFAULT_LEGAL_DOCUMENTS.ad, ...legalResult.ad },
                mobile: { ...DEFAULT_LEGAL_DOCUMENTS.mobile, ...legalResult.mobile },
                partnership: { ...DEFAULT_LEGAL_DOCUMENTS.partnership, ...legalResult.partnership },
              } satisfies Record<LegalDocumentSlug, AdminLegalDocumentState>;

              setLegalDocs(mergedLegalDocs);
              setBaseline(
                createDefaultAdminSettingsState({
                  siteSettings: result.siteSettings,
                  homeSeo: result.homeSeo,
                  legalDocs: mergedLegalDocs,
                }),
              );
            } else {
              setBaseline(
                createDefaultAdminSettingsState({
                  siteSettings: result.siteSettings,
                  homeSeo: result.homeSeo,
                  legalDocs: DEFAULT_LEGAL_DOCUMENTS,
                }),
              );
            }
          }
        }
      } catch {
        return;
      }
    };

    void load();
  }, []);

  const dirtyState = useMemo(
    () =>
      getAdminSettingsDirtyState({
        baseline,
        siteForm,
        seoForm,
        legalDocs,
      }),
    [baseline, siteForm, seoForm, legalDocs],
  );

  useEffect(() => {
    if (!dirtyState.hasAnyChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyState.hasAnyChanges]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...siteForm,
          ...seoForm,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? '설정을 저장하지 못했습니다.');
      }

      setBaseline(
        createDefaultAdminSettingsState({
          siteSettings: siteForm,
          homeSeo: seoForm,
          legalDocs,
        }),
      );
      setLegalSaveMessage('사이트 기본 설정 저장 완료');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '설정을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLegalDocument(slug: LegalDocumentSlug) {
    setIsLegalSaving(slug);
    setError(null);
    setLegalSaveMessage(null);

    try {
      const response = await fetch('/api/admin/legal-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...legalDocs[slug] }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? '법률 문서를 저장하지 못했습니다.');
      }

      const result = (await response.json()) as ResolvedLegalDocument;
      const nextDocument = {
        eyebrow: result.eyebrow,
        title: result.title,
        description: result.description,
        note: result.note,
        body: result.body,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
      } satisfies AdminLegalDocumentState;

      setLegalDocs((current) => {
        const nextLegalDocs = {
          ...current,
          [slug]: nextDocument,
        };

        setBaseline((currentBaseline) =>
          currentBaseline
            ? createDefaultAdminSettingsState({
                siteSettings: currentBaseline.siteForm,
                homeSeo: currentBaseline.seoForm,
                legalDocs: nextLegalDocs,
              })
            : currentBaseline,
        );

        return nextLegalDocs;
      });
      setLegalSaveMessage(`${result.title} 저장 완료`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '법률 문서를 저장하지 못했습니다.');
    } finally {
      setIsLegalSaving(null);
    }
  }

  function handleResetAllSettings() {
    if (!baseline) {
      return;
    }

    setSiteForm({ ...baseline.siteForm });
    setSeoForm({ ...baseline.seoForm });
    setLegalDocs({
      privacy: { ...baseline.legalDocs.privacy },
      terms: { ...baseline.legalDocs.terms },
      youth: { ...baseline.legalDocs.youth },
      ad: { ...baseline.legalDocs.ad },
      mobile: { ...baseline.legalDocs.mobile },
      partnership: { ...baseline.legalDocs.partnership },
    });
    setPreviewSlug(null);
    setLegalSaveMessage('저장된 기준으로 편집 내용 되돌림');
  }

  function handleResetLegalDocument(slug: LegalDocumentSlug) {
    setLegalDocs((current) => ({
      ...current,
      [slug]: resetLegalDocumentToDefault(slug, current[slug]),
    }));
    setLegalSaveMessage(null);
  }

  const seoSections = [
    {
      key: 'section1',
      label: '첫 번째 블록',
      color: 'text-[var(--portal-brand)]',
      title: seoForm.section1Title,
      content: seoForm.section1Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section1Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section1Content: value })),
    },
    {
      key: 'section2',
      label: '두 번째 블록',
      color: 'text-[var(--portal-brand)]',
      title: seoForm.section2Title,
      content: seoForm.section2Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section2Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section2Content: value })),
    },
    {
      key: 'section3',
      label: '세 번째 블록',
      color: 'text-[var(--portal-brand)]',
      title: seoForm.section3Title,
      content: seoForm.section3Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section3Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section3Content: value })),
    },
  ];

  const previewDocument = previewSlug ? legalDocs[previewSlug] : null;
  const previewSections = useMemo(() => (previewDocument ? parseLegalDocumentBody(previewDocument.body) : []), [previewDocument]);

  const legalDocCards: Array<{
    slug: LegalDocumentSlug;
    label: string;
    icon: typeof Shield;
    accent: string;
  }> = [
    { slug: 'privacy', label: '개인정보처리방침', icon: Shield, accent: 'text-emerald-600' },
    { slug: 'terms', label: '이용약관', icon: FileText, accent: 'text-sky-600' },
    { slug: 'youth', label: '청소년보호정책', icon: Shield, accent: 'text-violet-600' },
    { slug: 'ad', label: '광고안내', icon: FileText, accent: 'text-amber-600' },
    { slug: 'mobile', label: '모바일웹 안내', icon: FileText, accent: 'text-cyan-600' },
    { slug: 'partnership', label: '제휴입점문의 설정', icon: FileText, accent: 'text-rose-600' },
  ];

  return (
    <div className="max-w-[1200px] space-y-10 pb-10">
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-4 backdrop-blur-md sm:mx-0 sm:px-0 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-2 text-lg font-black text-gray-800 sm:text-xl">
          <Settings className="h-5 w-5 text-[var(--portal-brand)]" /> 사이트 통합 관리 설정
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {dirtyState.hasAnyChanges ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              저장 안 된 변경 있음
            </span>
          ) : (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              저장 상태 최신
            </span>
          )}
          <button
            type="button"
            onClick={handleResetAllSettings}
            disabled={!dirtyState.hasAnyChanges}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all active:scale-95',
              dirtyState.hasAnyChanges
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400',
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" /> 편집 되돌리기
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !dirtyState.hasAnyChanges}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95',
              isSaving || !dirtyState.hasAnyChanges ? 'cursor-not-allowed bg-gray-400' : 'bg-[var(--portal-brand)] hover:bg-[var(--portal-brand-hover)]',
            )}
          >
            <Save className={clsx('h-3.5 w-3.5', isSaving && 'animate-spin')} />
            {isSaving ? '저장 중...' : '전체 설정 저장'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {legalSaveMessage ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {legalSaveMessage}
          </div>
        ) : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      </div>

      {dirtyState.hasAnyChanges ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">저장되지 않은 변경 사항이 있습니다.</p>
            <p className="text-xs text-amber-700">페이지를 벗어나면 저장 전 편집 내용이 사라질 수 있습니다.</p>
          </div>
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-sky-600 pl-3">
          <Globe className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">1. 사이트 기본 모듈 설정</h2>
          {dirtyState.hasSiteChanges ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">수정됨</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">기본 브랜드 설정</div>
              <div className="space-y-4 p-5">
                <div>
                  <label className={lbl}>사이트 이름</label>
                  <input
                    type="text"
                    value={siteForm.siteName}
                    onChange={(event) => setSiteForm((current) => ({ ...current, siteName: event.target.value }))}
                    className={ipt}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={lbl}>사이트 제목 (SEO)</label>
                    <input
                      type="text"
                      value={siteForm.siteTitle}
                      onChange={(event) => setSiteForm((current) => ({ ...current, siteTitle: event.target.value }))}
                      className={ipt}
                    />
                  </div>
                  <div>
                    <label className={lbl}>사이트 영문명/설명</label>
                    <input
                      type="text"
                      value={siteForm.siteDescription}
                      onChange={(event) => setSiteForm((current) => ({ ...current, siteDescription: event.target.value }))}
                      className={ipt}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">홈 화면 상단 배너 문구</div>
              <div className="space-y-4 p-5">
                <div>
                  <label className={lbl}>배너 메인 강조 텍스트</label>
                  <input
                    type="text"
                    value={siteForm.heroMainText}
                    onChange={(event) => setSiteForm((current) => ({ ...current, heroMainText: event.target.value }))}
                    className={ipt}
                  />
                </div>
                <div>
                  <label className={lbl}>배너 하단 안내 텍스트</label>
                  <input
                    type="text"
                    value={siteForm.heroSubText}
                    onChange={(event) => setSiteForm((current) => ({ ...current, heroSubText: event.target.value }))}
                    className={ipt}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">연락처 및 푸터 정보</div>
              <div className="space-y-4 p-5">
                <div>
                  <label className={lbl}>대표 연락처</label>
                  <input
                    type="text"
                    value={siteForm.contactPhone}
                    onChange={(event) => setSiteForm((current) => ({ ...current, contactPhone: event.target.value }))}
                    className={ipt}
                  />
                </div>
                <div>
                  <label className={lbl}>푸터 사업자 정보</label>
                  <textarea
                    rows={4}
                    value={siteForm.footerInfo}
                    onChange={(event) => setSiteForm((current) => ({ ...current, footerInfo: event.target.value }))}
                    className={ipt}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-[var(--portal-brand)] pl-3">
          <Layout className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">2. 홈페이지 하단 SEO 문구 관리</h2>
          {dirtyState.hasSeoChanges ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">수정됨</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {seoSections.map((section) => (
            <div key={section.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <span className={`text-xs font-bold ${section.color}`}>{section.label}</span>
                <Type className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="space-y-3 p-4">
                <input
                  type="text"
                  value={section.title}
                  onChange={(event) => section.setTitle(event.target.value)}
                  className={ipt}
                  placeholder="제목 입력"
                />
                <textarea
                  rows={5}
                  value={section.content}
                  onChange={(event) => section.setContent(event.target.value)}
                  className={ipt}
                  placeholder="내용 입력"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
          <Shield className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">3. 약관 · 정책 문구 관리</h2>
          {Object.values(dirtyState.legalDocs).some(Boolean) ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">수정됨</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {legalDocCards.map((doc) => {
            const Icon = doc.icon;
            const current = legalDocs[doc.slug];
            const saving = isLegalSaving === doc.slug;

            return (
              <div key={doc.slug} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${doc.accent}`} />
                    <span className="text-sm font-bold text-gray-700">{doc.label}</span>
                    {dirtyState.legalDocs[doc.slug] ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">편집 중</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResetLegalDocument(doc.slug)}
                      className={clsx(
                        'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                        dirtyState.legalDocs[doc.slug]
                          ? 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400',
                      )}
                      disabled={!dirtyState.legalDocs[doc.slug]}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> 기본 문구 복원
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSlug((currentSlug) => (currentSlug === doc.slug ? null : doc.slug))}
                      className={clsx(
                        'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                        previewSlug === doc.slug
                          ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-brand-dark)]'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {previewSlug === doc.slug ? '미리보기 닫기' : '미리보기'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveLegalDocument(doc.slug)}
                      disabled={saving}
                      className={clsx(
                        'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95',
                        saving ? 'cursor-not-allowed bg-gray-400' : 'bg-[var(--portal-brand)] hover:bg-[var(--portal-brand-hover)]',
                      )}
                    >
                      <Save className={clsx('h-3.5 w-3.5', saving && 'animate-spin')} />
                      {saving ? '저장 중...' : '문서 저장'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">마지막 저장</span> · {formatUpdatedAt(current.updatedAt)}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={lbl}>Eyebrow</label>
                      <input
                        type="text"
                        value={current.eyebrow}
                        onChange={(event) =>
                          setLegalDocs((prev) => ({
                            ...prev,
                            [doc.slug]: { ...prev[doc.slug], eyebrow: event.target.value },
                          }))
                        }
                        className={ipt}
                      />
                    </div>
                    <div>
                      <label className={lbl}>문서 제목</label>
                      <input
                        type="text"
                        value={current.title}
                        onChange={(event) =>
                          setLegalDocs((prev) => ({
                            ...prev,
                            [doc.slug]: { ...prev[doc.slug], title: event.target.value },
                          }))
                        }
                        className={ipt}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>상단 설명</label>
                    <textarea
                      rows={3}
                      value={current.description}
                      onChange={(event) =>
                        setLegalDocs((prev) => ({
                          ...prev,
                          [doc.slug]: { ...prev[doc.slug], description: event.target.value },
                        }))
                      }
                      className={ipt}
                    />
                  </div>
                  {doc.slug === 'ad' ? (
                    <AdCustomEditor
                      body={current.body}
                      onChange={(newBody) =>
                        setLegalDocs((prev) => ({
                          ...prev,
                          ad: { ...prev.ad, body: newBody },
                        }))
                      }
                      ipt={ipt}
                      lbl={lbl}
                    />
                  ) : (
                    <div>
                      <label className={lbl}>본문 섹션</label>
                      <textarea
                        rows={14}
                        value={current.body}
                        onChange={(event) =>
                          setLegalDocs((prev) => ({
                            ...prev,
                            [doc.slug]: { ...prev[doc.slug], body: event.target.value },
                          }))
                        }
                        className={`${ipt} font-mono text-[13px] leading-6`}
                      />
                      <p className="mt-2 text-[11px] text-gray-400">형식: `## 섹션 제목`으로 시작하고, 항목은 `- 내용` 형식으로 입력합니다.</p>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>하단 안내 문구</label>
                    <textarea
                      rows={3}
                      value={current.note}
                      onChange={(event) =>
                        setLegalDocs((prev) => ({
                          ...prev,
                          [doc.slug]: { ...prev[doc.slug], note: event.target.value },
                        }))
                      }
                      className={ipt}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {previewDocument ? (
        <section className="rounded-xl border border-[var(--portal-brand)]/30 bg-[white] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--portal-brand-dark)]">
            <Eye className="h-4 w-4" />
            문서 미리보기
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">{previewDocument.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-gray-900">{previewDocument.title}</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600">{previewDocument.description}</p>
            <div className="mt-5 space-y-4">
              {previewSections.map((section) => (
                <section key={section.title} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-base font-bold text-gray-900">{section.title}</h4>
                  <div className="mt-2 space-y-2 text-sm leading-7 text-gray-600">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.items?.length ? (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-7 text-gray-600">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
            {previewDocument.note ? (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{previewDocument.note}</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="flex gap-3 rounded-xl border border-[var(--portal-brand)]/20 bg-[var(--portal-brand-soft)] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-brand)]" />
        <div className="text-xs leading-relaxed text-[var(--color-text-primary)]">
          <p className="mb-1 font-bold">관리 지침</p>
          <p>
            1번 섹션은 사이트 전체의 기본 레이아웃과 배너 문구에 영향을 주며, 2번 섹션은 홈 화면 최하단의
            마케팅용 SEO 텍스트를 구성합니다. 3번 섹션은 푸터의 정책/안내 페이지에 즉시 반영되며, 미리보기와 마지막 저장 시각도 함께 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
