'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { createSubmissionLock } from '@/lib/client/submission-lock';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';
import type { Course, Shop, User } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
  routeBase: '/admin/shops' | '/owner/shops';
};

const STEPS = [
  { label: '기본 정보', desc: '업체명·지역·테마' },
  { label: '상세 정보', desc: '설명·시간·연락처' },
  { label: '코스 등록', desc: '요금표 설정' },
  { label: '태그·이미지', desc: '태그·썸네일' },
  { label: '미리보기', desc: '최종 확인' },
] as const;

const THEME_EMOJI: Record<string, string> = {
  swedish: '🌿',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '🔥',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
};

const DEFAULT_ADMIN: User = {
  id: 'admin',
  email: 'admin@massage.local',
  name: '관리자',
  role: 'ADMIN',
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20';
const labelClassName = 'mb-1 block text-xs font-bold text-gray-700';

function createInitialShop(currentUser: User): Shop {
  const defaultRegion = REGIONS.find((region) => region.code === 'seoul') ?? REGIONS[0];
  const defaultTheme = THEMES.find((theme) => theme.code === 'swedish') ?? THEMES[0];
  const baselineTime = new Date().toISOString();

  return {
    id: `shop-${Date.now()}`,
    name: '',
    slug: '',
    region: defaultRegion.code,
    regionLabel: defaultRegion.label,
    subRegion: '',
    subRegionLabel: '',
    theme: defaultTheme.code,
    themeLabel: defaultTheme.label,
    isPremium: false,
    premiumOrder: undefined,
    thumbnailUrl: '',
    bannerUrl: '',
    images: [],
    tagline: '',
    description: '',
    address: '',
    phone: '',
    hours: '',
    rating: 0,
    reviewCount: 0,
    courses: [],
    tags: [],
    isVisible: currentUser.role === 'ADMIN',
    ownerId: currentUser.id,
    createdAt: baselineTime,
    updatedAt: baselineTime,
  };
}

export default function ShopEditorPage({ params, routeBase }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';

  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_ADMIN);
  const [form, setForm] = useState<Shop | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tagsStr, setTagsStr] = useState('');
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [thumbPreview, setThumbPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const submitLockRef = useRef(createSubmissionLock());

  const thumbRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setSaveError('');

      try {
        const [meResponse, shopResponse] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          isNew ? Promise.resolve(null) : fetch(`/api/admin/shops/${id}`, { cache: 'no-store' }),
        ]);

        const meResult = (await meResponse.json()) as { user?: User | null };
        const nextUser = meResult.user ?? DEFAULT_ADMIN;
        setCurrentUser(nextUser);

        if (isNew) {
          const initialShop = createInitialShop(nextUser);
          setForm(initialShop);
          setCourses(initialShop.courses);
          setTagsStr(initialShop.tags.join(', '));
          setThumbPreview(initialShop.thumbnailUrl);
          setBannerPreview(initialShop.bannerUrl);
          setGalleryPreviews(initialShop.images);
          return;
        }

        if (!shopResponse) {
          setForm(null);
          return;
        }

        const shopResult = (await shopResponse.json()) as { shop?: Shop };
        if (shopResponse.ok && shopResult.shop) {
          setForm(shopResult.shop);
          setCourses(shopResult.shop.courses);
          setTagsStr(shopResult.shop.tags.join(', '));
          setThumbPreview(shopResult.shop.thumbnailUrl);
          setBannerPreview(shopResult.shop.bannerUrl);
          setGalleryPreviews(shopResult.shop.images);
        } else {
          setForm(null);
        }
      } catch {
        setForm(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, isNew]);

  const syncPreviewState = (nextForm: Shop) => {
    setForm(nextForm);
    setThumbPreview(nextForm.thumbnailUrl);
    setBannerPreview(nextForm.bannerUrl);
    setGalleryPreviews(nextForm.images);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event.target?.result ?? ''));
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    });

  const updateCourse = (index: number, field: keyof Course, value: string) => {
    setCourses((current) => {
      const nextCourses = [...current];
      nextCourses[index] = { ...nextCourses[index], [field]: value };
      return nextCourses;
    });
  };

  const canNext = () => {
    if (!form) {
      return false;
    }
    if (step === 0) {
      return form.name.trim() !== '' && form.slug.trim() !== '' && form.region.trim() !== '' && form.theme.trim() !== '';
    }
    if (step === 1) {
      return form.phone.trim() !== '' && form.hours.trim() !== '';
    }
    return true;
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">업소 정보를 불러오는 중...</div>;
  }

  if (!form) {
    return <div className="p-10 text-center text-gray-500">업소 정보를 찾을 수 없습니다.</div>;
  }

  if (!isNew && currentUser.role === 'OWNER' && form.ownerId !== currentUser.id) {
    return <div className="p-10 text-center font-bold text-red-500">내 계정에 연결된 업소만 수정할 수 있습니다.</div>;
  }

  const currentDistricts = DISTRICTS[form.region] ?? [];

  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRegion = REGIONS.find((region) => region.code === event.target.value);
    if (!nextRegion) {
      return;
    }

    setForm({
      ...form,
      region: nextRegion.code,
      regionLabel: nextRegion.label,
      subRegion: '',
      subRegionLabel: '',
    });
  };

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDistrict = currentDistricts.find((district) => district.code === event.target.value);
    setForm({
      ...form,
      subRegion: event.target.value,
      subRegionLabel: nextDistrict?.label ?? '',
    });
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = THEMES.find((theme) => theme.code === event.target.value);
    if (!nextTheme) {
      return;
    }

    setForm({
      ...form,
      theme: nextTheme.code,
      themeLabel: nextTheme.label,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!submitLockRef.current.tryAcquire()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    let shouldReleaseLock = true;

    try {
      const nextShop: Shop = {
        ...form,
        courses,
        tags: tagsStr
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        images: galleryPreviews,
        thumbnailUrl: thumbPreview,
        bannerUrl: bannerPreview,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(isNew ? '/api/admin/shops' : `/api/admin/shops/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: nextShop }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (response.ok) {
        shouldReleaseLock = false;
        router.replace(routeBase);
        return;
      }

      setSaveError(result?.error ?? '저장에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      if (shouldReleaseLock) {
        submitLockRef.current.release();
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="max-w-[860px] space-y-4 pb-10">
      <div className="mb-2 flex items-center gap-2">
        <Link href={routeBase} className="rounded p-1 text-gray-600 hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-gray-800">{isNew ? '업소 등록' : '업소 수정'}</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center">
          {STEPS.map((stepInfo, index) => (
            <div key={stepInfo.label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                className={clsx('step-item shrink-0', index === step && 'active', index < step && 'completed')}
              >
                <div className="step-num">{index < step ? '✓' : index + 1}</div>
                <div className="hidden sm:block">
                  <div className="text-[11px]">{stepInfo.label}</div>
                  <div className="text-[9px] opacity-70">{stepInfo.desc}</div>
                </div>
              </button>
              {index < STEPS.length - 1 ? <div className={clsx('step-connector', index < step && 'active')} /> : null}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 0 ? (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="border-b border-gray-100 pb-2 text-base font-black text-gray-800">① 기본 정보</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName}>업소명 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className={inputClassName}
                  placeholder="예: 강남 힐링스파"
                />
              </div>
              <div>
                <label className={labelClassName}>슬러그 (URL 영문) *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                  className={inputClassName}
                  placeholder="예: gangnam-healing-spa"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClassName}>지역 *</label>
                <select value={form.region} onChange={handleRegionChange} className={inputClassName}>
                  {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>상세 지역구</label>
                <select value={form.subRegion ?? ''} onChange={handleDistrictChange} className={inputClassName} disabled={currentDistricts.length === 0}>
                  <option value="">선택 (없음)</option>
                  {currentDistricts.filter((district) => district.code !== 'all').map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>테마 *</label>
                <select value={form.theme} onChange={handleThemeChange} className={inputClassName}>
                  {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                    <option key={theme.code} value={theme.code}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClassName}>메인 캐치프레이즈 (목록 노출)</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                className={inputClassName}
                placeholder="예: 강남 최고의 프리미엄 스웨디시 마사지"
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="border-b border-gray-100 pb-2 text-base font-black text-gray-800">② 상세 정보</h2>

            <div>
              <label className={labelClassName}>상세 설명</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={`${inputClassName} resize-none`}
                placeholder="업소 소개, 특장점, 서비스 안내 등"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName}>연락처 *</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className={inputClassName}
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className={labelClassName}>영업시간 *</label>
                <input
                  type="text"
                  required
                  value={form.hours}
                  onChange={(event) => setForm({ ...form, hours: event.target.value })}
                  className={inputClassName}
                  placeholder="매일 10:00 - 23:00"
                />
              </div>
            </div>

            <div>
              <label className={labelClassName}>주소</label>
              <input
                type="text"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                className={inputClassName}
                placeholder="서울특별시 강남구 테헤란로 123"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-base font-black text-gray-800">③ 코스/요금표</h2>
              <button
                type="button"
                onClick={() => setCourses((current) => [...current, { name: '', price: '', duration: '', description: '' }])}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                <Plus className="h-3.5 w-3.5" /> 코스 추가
              </button>
            </div>

            <div className="space-y-3">
              {courses.map((course, index) => (
                <div key={`${course.name}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="코스명"
                        value={course.name}
                        onChange={(event) => updateCourse(index, 'name', event.target.value)}
                        className={inputClassName}
                      />
                      <input
                        type="text"
                        placeholder="시간 (예: 60분)"
                        value={course.duration}
                        onChange={(event) => updateCourse(index, 'duration', event.target.value)}
                        className={inputClassName}
                      />
                      <input
                        type="text"
                        placeholder="요금 (예: 70,000원)"
                        value={course.price}
                        onChange={(event) => updateCourse(index, 'price', event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCourses((current) => current.filter((_, courseIndex) => courseIndex !== index))}
                      className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="코스 설명 (선택)"
                      value={course.description ?? ''}
                      onChange={(event) => updateCourse(index, 'description', event.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              ))}

              {courses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-400">
                  + 코스 추가 버튼을 눌러 요금표를 등록하세요
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="border-b border-gray-100 pb-2 text-base font-black text-gray-800">④ 태그·이미지</h2>

            <div>
              <label className={labelClassName}>태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(event) => setTagsStr(event.target.value)}
                className={inputClassName}
                placeholder="예: 무료주차, 카드결제, 여성전용"
              />
              <div className="mt-1 text-[11px] text-gray-400">
                미리보기 태그:{' '}
                {tagsStr
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="mr-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>

            <div>
              <label className={labelClassName}>
                썸네일 이미지 <span className="font-normal text-gray-400">(1:1 비율 권장)</span>
              </label>
              <div
                onClick={() => thumbRef.current?.click()}
                className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-red-400"
              >
                {thumbPreview ? (
                  <img src={thumbPreview} alt="썸네일" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="mb-1 text-2xl">🖼️</div>
                    <div className="text-[11px]">클릭하여 업로드</div>
                  </div>
                )}
              </div>
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const preview = await readFileAsDataUrl(file);
                  const nextForm = { ...form, thumbnailUrl: preview };
                  syncPreviewState(nextForm);
                  event.target.value = '';
                }}
              />
              {thumbPreview ? (
                <button
                  type="button"
                  onClick={() => syncPreviewState({ ...form, thumbnailUrl: '' })}
                  className="mt-1 text-[11px] text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              ) : null}
            </div>

            <div>
              <label className={labelClassName}>
                배너 이미지 <span className="font-normal text-gray-400">(2:1 비율 권장)</span>
              </label>
              <div
                onClick={() => bannerRef.current?.click()}
                className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-red-400"
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="배너" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="mb-1 text-2xl">🌄</div>
                    <div className="text-[11px]">클릭하여 배너 업로드</div>
                  </div>
                )}
              </div>
              <input
                ref={bannerRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const preview = await readFileAsDataUrl(file);
                  const nextForm = { ...form, bannerUrl: preview };
                  syncPreviewState(nextForm);
                  event.target.value = '';
                }}
              />
              {bannerPreview ? (
                <button
                  type="button"
                  onClick={() => syncPreviewState({ ...form, bannerUrl: '' })}
                  className="mt-1 text-[11px] text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              ) : null}
            </div>

            <div>
              <label className={labelClassName}>
                갤러리 사진 <span className="font-normal text-gray-400">(여러 장 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {galleryPreviews.map((src, index) => (
                  <div key={`${src.slice(0, 20)}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                    <img src={src} alt={`갤러리 ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const nextImages = galleryPreviews.filter((_, imageIndex) => imageIndex !== index);
                        syncPreviewState({ ...form, images: nextImages });
                      }}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => galleryRef.current?.click()}
                  className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-2xl text-gray-400 transition-colors hover:border-red-400"
                >
                  +
                </div>
              </div>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length === 0) {
                    return;
                  }
                  const previews = await Promise.all(files.map(readFileAsDataUrl));
                  const nextImages = [...galleryPreviews, ...previews];
                  syncPreviewState({ ...form, images: nextImages });
                  event.target.value = '';
                }}
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-base font-black text-gray-800">
                <Eye className="h-4 w-4 text-blue-500" /> 미리보기
              </h2>

              <div className="mb-6">
                <p className="mb-2 text-xs font-bold text-gray-500">목록 카드 미리보기</p>
                <div className="max-w-[200px]">
                  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    {thumbPreview ? (
                      <img src={thumbPreview} alt="목록 썸네일 미리보기" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-amber-100 to-orange-50 text-5xl">
                        {THEME_EMOJI[form.theme] ?? '✨'}
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="truncate text-sm font-bold text-gray-900">{form.name || '업소명'}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="text-[11px] text-red-600">{form.regionLabel}</span>
                        {form.subRegionLabel ? <span className="text-[10px] text-gray-400">{form.subRegionLabel}</span> : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">#{form.themeLabel}</span>
                        {tagsStr
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((tag) => (
                            <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                              {tag}
                            </span>
                          ))}
                      </div>
                      {courses[0]?.price ? (
                        <div className="mt-2 border-t border-gray-100 pt-1.5 text-right">
                          <span className="text-xs font-bold text-red-600">{courses[0].price}~</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p className="border-b pb-1 text-xs font-bold text-gray-500">기본 정보</p>
                  <div className="flex gap-2"><span className="w-20 shrink-0 text-gray-400">업소명</span><span className="font-semibold">{form.name || '-'}</span></div>
                  <div className="flex gap-2"><span className="w-20 shrink-0 text-gray-400">지역</span><span>{form.regionLabel} {form.subRegionLabel}</span></div>
                  <div className="flex gap-2"><span className="w-20 shrink-0 text-gray-400">테마</span><span>{form.themeLabel}</span></div>
                  <div className="flex gap-2"><span className="w-20 shrink-0 text-gray-400">슬러그</span><span className="font-mono text-xs text-blue-600">/shop/{form.slug || '...'}</span></div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="border-b pb-1 text-xs font-bold text-gray-500">연락·운영</p>
                  <div className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-gray-400" /><span>{form.phone || '-'}</span></div>
                  <div className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-gray-400" /><span>{form.hours || '-'}</span></div>
                  <div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-gray-400" /><span className="text-xs">{form.address || '-'}</span></div>
                </div>
              </div>

              {courses.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 border-b pb-1 text-xs font-bold text-gray-500">코스 요금</p>
                  <div className="space-y-1">
                    {courses.map((course, index) => (
                      <div key={`${course.name}-${index}`} className="flex justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                        <span>
                          {course.name || `코스 ${index + 1}`}{' '}
                          <span className="text-xs text-gray-400">({course.duration || '-'})</span>
                        </span>
                        <span className="font-bold text-red-600">{course.price || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {galleryPreviews.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 border-b pb-1 text-xs font-bold text-gray-500">갤러리 미리보기</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {galleryPreviews.map((src, index) => (
                      <img key={`${src.slice(0, 20)}-${index}`} src={src} alt={`갤러리 미리보기 ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              ) : null}

              {saveError ? <p className="mt-4 text-sm font-medium text-red-500">{saveError}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex justify-between gap-2">
          <div>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((currentStep) => currentStep - 1)}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> 이전
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Link href={routeBase} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              취소
            </Link>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((currentStep) => currentStep + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음 <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {isSaving ? '저장 중...' : '저장 완료'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
