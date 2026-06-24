'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Banner = { slot: string; imageUrl: string; linkUrl: string | null; isActive: boolean };

const SLOTS: { slot: string; label: string; spec: string; heightClass: string }[] = [
  { slot: 'detail', label: '매장 상세 우측 배너', spec: '권장 280×200', heightClass: 'h-[120px]' },
  { slot: 'sidebar', label: '사이드바 배너', spec: '권장 180×150', heightClass: 'h-[120px]' },
  { slot: 'mobile', label: '모바일 하단 배너', spec: '모바일 메인', heightClass: 'h-[120px]' },
];

export default function AdBannerManager() {
  const [banners, setBanners] = useState<Record<string, Banner>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/admin/ad-banners', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d: { banners?: Banner[] }) => {
        const map: Record<string, Banner> = {};
        (d.banners ?? []).forEach((b) => {
          map[b.slot] = b;
        });
        setBanners(map);
      })
      .catch(() => {});
  }, []);

  const save = async (slot: string, patch: Partial<Banner>) => {
    setBusy(slot);
    setError(null);
    try {
      const res = await fetch('/api/admin/ad-banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ slot, ...patch }),
      });
      const j = (await res.json()) as { banner?: Banner; error?: string };
      if (!res.ok || !j.banner) {
        throw new Error(j.error ?? '저장하지 못했습니다.');
      }
      setBanners((prev) => ({ ...prev, [slot]: j.banner! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    } finally {
      setBusy(null);
    }
  };

  const onAttach = async (slot: string, file: File | undefined) => {
    if (!file) return;
    setBusy(slot);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      const uj = (await up.json()) as { urls?: string[]; error?: string };
      if (!up.ok || !uj.urls?.[0]) {
        throw new Error(uj.error ?? '이미지 업로드에 실패했습니다.');
      }
      await save(slot, { imageUrl: uj.urls[0], isActive: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 업로드에 실패했습니다.');
      setBusy(null);
    }
  };

  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="text-xs font-bold text-gray-600">광고 배너 슬롯 (이미지 첨부 · 슬롯 크기에 자동 맞춤)</span>
      </div>

      {error ? <p className="px-4 pt-3 text-xs text-red-600">{error}</p> : null}

      <div className="divide-y divide-gray-100">
        {SLOTS.map(({ slot, label, spec, heightClass }) => {
          const banner = banners[slot];
          const isBusy = busy === slot;
          return (
            <div key={slot} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className={clsx('relative w-40 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50', heightClass)}>
                {banner?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={banner.imageUrl} alt={label} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-300">
                    <ImagePlus className="h-5 w-5" />
                    <span className="mt-1 text-[10px]">미설정</span>
                  </div>
                )}
                {isBusy ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : null}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-400">{spec}</p>
                  </div>
                  {banner?.imageUrl ? (
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                      <input
                        type="checkbox"
                        className="accent-red-600"
                        checked={banner.isActive}
                        disabled={isBusy}
                        onChange={(e) => save(slot, { isActive: e.target.checked })}
                      />
                      노출
                    </label>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={(el) => {
                      fileRefs.current[slot] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void onAttach(slot, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => fileRefs.current[slot]?.click()}
                    className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> 이미지 첨부
                  </button>
                  {banner?.imageUrl ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => save(slot, { imageUrl: '', linkUrl: null, isActive: false })}
                      className="flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 삭제
                    </button>
                  ) : null}
                </div>

                {banner?.imageUrl ? (
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <input
                      type="text"
                      defaultValue={banner.linkUrl ?? ''}
                      placeholder="클릭 시 이동할 링크 (선택)"
                      disabled={isBusy}
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next !== (banner.linkUrl ?? '')) {
                          void save(slot, { linkUrl: next || null });
                        }
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-red-500"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
