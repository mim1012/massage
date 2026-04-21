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
      <div className="mx-auto max-w-[600px] px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-black text-gray-900">제휴 문의가 접수되었습니다</h1>
        <p className="mb-8 text-gray-600">
          문의 내용을 확인한 뒤 등록 및 제휴 절차를 안내해 드리겠습니다.
        </p>
        <Link href="/" className="inline-block rounded-xl bg-red-600 px-8 py-3 font-bold text-white hover:bg-red-700">
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
        <span className="text-gray-800">제휴문의</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-red-600 to-rose-500 p-8 text-center text-white">
          <h1 className="mb-2 text-3xl font-black">제휴문의</h1>
          <p className="text-sm text-white/85">업체 등록 및 제휴 요청 내용을 남겨주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-10">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-black text-gray-700">
                <Building2 className="h-3.5 w-3.5 text-red-500" />
                업체명
              </label>
              <input
                required
                value={form.shopName}
                onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-gray-700">담당자명</label>
              <input
                required
                value={form.contactName}
                onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-black text-gray-700">
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                지역
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={form.region}
                  onChange={(event) => setForm((current) => ({ ...current, region: event.target.value, subRegion: '' }))}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
                >
                  {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                    <option key={region.code} value={region.code}>{region.label}</option>
                  ))}
                </select>
                <select
                  value={form.subRegion}
                  onChange={(event) => setForm((current) => ({ ...current, subRegion: event.target.value }))}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
                >
                  <option value="">세부 지역</option>
                  {currentDistricts.filter((district) => district.code !== 'all').map((district) => (
                    <option key={district.code} value={district.code}>{district.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-black text-gray-700">
                <Tag className="h-3.5 w-3.5 text-red-500" />
                테마
              </label>
              <select
                value={form.theme}
                onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
              >
                {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                  <option key={theme.code} value={theme.code}>{theme.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-black text-gray-700">
                <Phone className="h-3.5 w-3.5 text-red-500" />
                연락처
              </label>
              <input
                required
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-gray-700">카카오톡 ID</label>
              <input
                value={form.kakaoId}
                onChange={(event) => setForm((current) => ({ ...current, kakaoId: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-gray-700">문의 내용</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-lg font-black text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? '접수 중...' : <><Send className="h-5 w-5" /> 문의 접수하기</>}
          </button>
        </form>
      </div>
    </div>
  );
}
