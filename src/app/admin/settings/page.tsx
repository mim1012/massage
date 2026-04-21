'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Globe, Info, Layout, Save, Settings } from 'lucide-react';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [siteForm, setSiteForm] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [seoForm, setSeoForm] = useState<HomeSeoContent>(MOCK_HOME_SEO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClassName =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as { siteSettings?: SiteSettings; homeSeo?: HomeSeoContent };
        if (result.siteSettings && result.homeSeo) {
          setSiteForm(result.siteSettings);
          setSeoForm(result.homeSeo);
        }
      } catch {
        return;
      }
    };

    void load();
  }, []);

  async function handleSave() {
    setSaving(true);
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
      setSaving(false);
    }
  }

  const sections = [
    {
      title: seoForm.section1Title,
      content: seoForm.section1Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section1Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section1Content: value })),
    },
    {
      title: seoForm.section2Title,
      content: seoForm.section2Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section2Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section2Content: value })),
    },
    {
      title: seoForm.section3Title,
      content: seoForm.section3Content,
      setTitle: (value: string) => setSeoForm((current) => ({ ...current, section3Title: value })),
      setContent: (value: string) => setSeoForm((current) => ({ ...current, section3Content: value })),
    },
  ];

  return (
    <div className="max-w-[1200px] space-y-8 pb-10">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-gray-50/90 py-4 backdrop-blur">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Settings className="h-5 w-5 text-red-600" />
          사이트 설정
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-bold text-white transition',
            saving ? 'cursor-not-allowed bg-gray-400' : 'bg-red-600 hover:bg-red-700',
          )}
        >
          <Save className={clsx('h-4 w-4', saving && 'animate-spin')} />
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
          <Globe className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">브랜드 및 메인 문구</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">
                브랜드 기본 정보
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">사이트명</label>
                  <input
                    value={siteForm.siteName}
                    onChange={(event) => setSiteForm((current) => ({ ...current, siteName: event.target.value }))}
                    className={inputClassName}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">사이트 제목</label>
                    <input
                      value={siteForm.siteTitle}
                      onChange={(event) => setSiteForm((current) => ({ ...current, siteTitle: event.target.value }))}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">사이트 설명</label>
                    <input
                      value={siteForm.siteDescription}
                      onChange={(event) =>
                        setSiteForm((current) => ({ ...current, siteDescription: event.target.value }))
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">
                메인 배너 문구
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">메인 문구</label>
                  <input
                    value={siteForm.heroMainText}
                    onChange={(event) =>
                      setSiteForm((current) => ({ ...current, heroMainText: event.target.value }))
                    }
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">보조 문구</label>
                  <input
                    value={siteForm.heroSubText}
                    onChange={(event) => setSiteForm((current) => ({ ...current, heroSubText: event.target.value }))}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">
              연락처 및 푸터
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">대표 연락처</label>
                <input
                  value={siteForm.contactPhone}
                  onChange={(event) => setSiteForm((current) => ({ ...current, contactPhone: event.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">푸터 정보</label>
                <textarea
                  rows={5}
                  value={siteForm.footerInfo}
                  onChange={(event) => setSiteForm((current) => ({ ...current, footerInfo: event.target.value }))}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-3">
          <Layout className="h-5 w-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">홈페이지 SEO 문구</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-blue-600">
                블록 {index + 1}
              </div>
              <div className="space-y-3 p-4">
                <input
                  value={section.title}
                  onChange={(event) => section.setTitle(event.target.value)}
                  className={inputClassName}
                  placeholder="제목"
                />
                <textarea
                  rows={6}
                  value={section.content}
                  onChange={(event) => section.setContent(event.target.value)}
                  className={inputClassName}
                  placeholder="내용"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <p>
          메인 배너와 홈페이지 SEO 문구는 관리자 화면에서 바로 수정할 수 있습니다. 저장한 내용은 사이트 전역에
          즉시 반영됩니다.
        </p>
      </div>
    </div>
  );
}
