'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Eye, FileText, Globe, Info, Layout, Save, Settings, Shield, Type } from 'lucide-react';
import {
  DEFAULT_LEGAL_DOCUMENTS,
  parseLegalDocumentBody,
  type EditableLegalDocument,
  type LegalDocumentSlug,
  type ResolvedLegalDocument,
} from '@/lib/legal-documents';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';

type AdminLegalDocument = EditableLegalDocument & {
  updatedAt?: string | null;
};

function formatUpdatedAt(value?: string | null) {
  if (!value) return '아직 저장 기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '저장 시각 확인 불가';

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function AdminSettingsPage() {
  const [siteForm, setSiteForm] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [seoForm, setSeoForm] = useState<HomeSeoContent>(MOCK_HOME_SEO);
  const [legalDocs, setLegalDocs] = useState<Record<LegalDocumentSlug, AdminLegalDocument>>(DEFAULT_LEGAL_DOCUMENTS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLegalSaving, setIsLegalSaving] = useState<LegalDocumentSlug | null>(null);
  const [legalSaveMessage, setLegalSaveMessage] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ipt =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]/20';
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
          }
        }

        if (legalResponse.ok) {
          const result = (await legalResponse.json()) as Partial<Record<LegalDocumentSlug, ResolvedLegalDocument>>;
          setLegalDocs((current) => ({
            privacy: { ...current.privacy, ...result.privacy },
            terms: { ...current.terms, ...result.terms },
            youth: { ...current.youth, ...result.youth },
            ad: { ...current.ad, ...result.ad },
            mobile: { ...current.mobile, ...result.mobile },
          }));
        }
      } catch {
        return;
      }
    };

    void load();
  }, []);

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
      setLegalDocs((current) => ({
        ...current,
        [slug]: {
          eyebrow: result.eyebrow,
          title: result.title,
          description: result.description,
          note: result.note,
          body: result.body,
          updatedAt: result.updatedAt ?? new Date().toISOString(),
        },
      }));
      setLegalSaveMessage(`${result.title} 저장 완료`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '법률 문서를 저장하지 못했습니다.');
    } finally {
      setIsLegalSaving(null);
    }
  }

  const seoSections = [
    {
      key: 'section1',
      label: '첫 번째 블록',
      color: 'text-[#D4A373]',
      title: seoForm.section1Title,
      content: seoForm.section1Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section1Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section1Content: value })),
    },
    {
      key: 'section2',
      label: '두 번째 블록',
      color: 'text-[#D4A373]',
      title: seoForm.section2Title,
      content: seoForm.section2Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section2Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section2Content: value })),
    },
    {
      key: 'section3',
      label: '세 번째 블록',
      color: 'text-blue-600',
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
  ];

  return (
    <div className="max-w-[1200px] space-y-10 pb-10">
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-4 backdrop-blur-md sm:mx-0 sm:px-0">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Settings className="h-5 w-5 text-[#D4A373]" /> 사이트 통합 관리 설정
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-md transition-all active:scale-95',
            isSaving ? 'cursor-not-allowed bg-gray-400' : 'bg-[#D4A373] hover:bg-[#C29262]',
          )}
        >
          <Save className={clsx('h-4 w-4', isSaving && 'animate-spin')} />
          {isSaving ? '저장 중...' : '전체 설정 저장'}
        </button>
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

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-sky-600 pl-3">
          <Globe className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">1. 사이트 기본 모듈 설정</h2>
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
        <div className="flex items-center gap-2 border-l-4 border-[#D4A373] pl-3">
          <Layout className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">2. 홈페이지 하단 SEO 문구 관리</h2>
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
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {legalDocCards.map((doc) => {
            const Icon = doc.icon;
            const current = legalDocs[doc.slug];
            const saving = isLegalSaving === doc.slug;

            return (
              <div key={doc.slug} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${doc.accent}`} />
                    <span className="text-sm font-bold text-gray-700">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSlug((currentSlug) => (currentSlug === doc.slug ? null : doc.slug))}
                      className={clsx(
                        'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                        previewSlug === doc.slug
                          ? 'border-[#D4A373] bg-[#FEFAE0] text-[#8A6338]'
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
                        saving ? 'cursor-not-allowed bg-gray-400' : 'bg-[#D4A373] hover:bg-[#C29262]',
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
        <section className="rounded-xl border border-[#D4A373]/30 bg-[#FFFDF8] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#8A6338]">
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

      <div className="flex gap-3 rounded-xl border border-[#D4A373]/20 bg-[#FEFAE0] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A373]" />
        <div className="text-xs leading-relaxed text-[#5F4B32]">
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
