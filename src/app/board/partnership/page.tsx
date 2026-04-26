'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, ChevronRight, MapPin, Phone, Send, Tag } from 'lucide-react';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';

export default function PartnershipPage() {
  const [form, setForm] = useState({
    shopName: '',
    region: 'seoul',
    subRegion: '',
    theme: 'swedish',
    contactName: '',
    phone: '',
    kakaoId: '',
    message: '',
  });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDistricts = DISTRICTS[form.region] ?? [];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch('/api/board/partnership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          throw new Error(result.error ?? '제휴 문의를 접수하지 못했습니다.');
        }

        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : '제휴 문의를 접수하지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12 text-center sm:py-20">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3 sm:p-4">
            <CheckCircle2 className="h-12 w-12 animate-bounce text-green-600 sm:h-16 sm:w-16" />
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">입점 문의 접수 완료!</h1>
        <p className="mb-10 leading-relaxed text-gray-600">
          보내주신 소중한 입점 문의가 정상적으로 접수되었습니다.
          <br />
          담당자가 확인 후 1~2일 내에 기재해주신 연락처로 안내해 드리겠습니다.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-red-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-red-200"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-3 py-6">
      <div className="mb-4 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">입점 문의</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:rounded-3xl">
        <div className="bg-gradient-to-br from-red-600 to-rose-500 p-6 text-center text-white sm:p-8">
          <h1 className="mb-2 text-xl font-black italic uppercase tracking-tight sm:mb-3 sm:text-3xl">Partnership</h1>
          <p className="text-xs font-medium leading-relaxed opacity-90 sm:text-base">
            대한민국 NO.1 마사지 플랫폼과
            <br className="sm:hidden" /> 함께 성장할 파트너를 모십니다.
          </p>
        </div>

        <div className="p-5 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">
                  <Building2 className="h-3.5 w-3.5 text-red-500" /> 업체명 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="정확한 업체명을 입력해 주세요"
                  value={form.shopName}
                  onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">담당자 성함 *</label>
                <input
                  type="text"
                  required
                  placeholder="성함을 입력해 주세요"
                  value={form.contactName}
                  onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">
                  <MapPin className="h-3.5 w-3.5 text-red-500" /> 지역 *
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={form.region}
                      onChange={(event) => setForm((current) => ({ ...current, region: event.target.value, subRegion: '' }))}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                    >
                      {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                        <option key={region.code} value={region.code}>{region.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={form.subRegion}
                      required={currentDistricts.length > 0}
                      onChange={(event) => setForm((current) => ({ ...current, subRegion: event.target.value }))}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">상세 구/군</option>
                      {currentDistricts.filter((district) => district.code !== 'all').map((district) => (
                        <option key={district.code} value={district.code}>{district.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">
                  <Tag className="h-3.5 w-3.5 text-red-500" /> 주요 테마 *
                </label>
                <div className="relative">
                  <select
                    value={form.theme}
                    onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                  >
                    {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                      <option key={theme.code} value={theme.code}>{theme.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">
                  <Phone className="h-3.5 w-3.5 text-red-500" /> 휴대폰 번호 *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-xs font-black text-gray-700">카카오톡 ID (선택)</label>
                <input
                  type="text"
                  placeholder="카톡 ID를 남겨주시면 빠른 상담이 가능합니다"
                  value={form.kakaoId}
                  onChange={(event) => setForm((current) => ({ ...current, kakaoId: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-black text-gray-700">기타 문의사항</label>
              <textarea
                rows={4}
                placeholder="입점 패키지 문의, 특별 요청 사항 등을 자유롭게 기재해 주세요."
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-red-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <input
                type="checkbox"
                required
                id="privacy"
                checked={privacyAgreed}
                onChange={(event) => setPrivacyAgreed(event.target.checked)}
                className="mt-1 accent-red-600"
              />
              <label htmlFor="privacy" className="cursor-pointer text-xs leading-relaxed text-gray-500">
                개인정보 수집 및 이용에 동의합니다. (작성하신 정보는 입점 상담 및 안내 목적으로만 사용되며, 1년간 보관 후 파기됩니다.)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-4 text-lg font-black text-white shadow-xl transition-all hover:bg-red-700 hover:shadow-red-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-5 w-5" /> 입점 문의하기
                </>
              )}
            </button>
          </form>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-100 pt-8 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <div className="rounded-full bg-red-100 p-2 text-red-600">
                <Phone className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Direct Call</p>
                <p className="text-sm font-black text-gray-800">010-1234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <div className="rounded-full bg-yellow-400 p-2 text-white">💬</div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kakao ID</p>
                <p className="text-sm font-black text-gray-800">healing_help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
