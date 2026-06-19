'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, ChevronRight, ChevronLeft, MapPin, Phone, Clock, Star } from 'lucide-react';
import { MOCK_SHOPS, MOCK_USERS } from '@/lib/mockData';
import { REGIONS, THEMES, DISTRICTS, Shop } from '@/lib/types';
import Link from 'next/link';
import clsx from 'clsx';
import RichTextEditor from '@/components/admin/RichTextEditor';

const STEPS = [
  { label: '기본 정보', desc: '업체명·지역·테마' },
  { label: '상세 정보', desc: '설명·시간·연락처' },
  { label: '코스 등록', desc: '요금표 설정' },
  { label: '태그·이미지', desc: '태그·썸네일' },
  { label: '미리보기', desc: '최종 확인' },
];

const themeEmoji: Record<string, string> = {
  swedish: '🌿', aroma: '🌸', thai: '🙏', sport: '💪',
  deep: '🔥', hot_stone: '💎', foot: '🦶', couple: '👫',
};

const ipt = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20";
const lbl = "block text-xs font-bold text-gray-700 mb-1";

export default function ShopEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const isOwner = document.body.innerText.includes('내 업소 관리 모드');
    setCurrentUser(isOwner ? MOCK_USERS[1] : MOCK_USERS[0]);
  }, []);

  const isNew = id === 'new';
  const targetShop = MOCK_SHOPS.find(s => s.id === id);

  const initialData: Shop = isNew ? {
    id: `shop-${Date.now()}`, slug: '', name: '', description: '', tagline: '', address: '', phone: '',
    hours: '', region: 'seoul', regionLabel: '서울', subRegion: '', subRegionLabel: '', theme: 'swedish', themeLabel: '스웨디시',
    rating: 0, reviewCount: 0, isPremium: false, 
    isVisible: currentUser.role === 'ADMIN',
    approvalStatus: currentUser.role === 'ADMIN' ? 'approved' : 'pending',
    courses: [], images: [], tags: [], ownerId: currentUser.id,
    thumbnailUrl: '', bannerUrl: '', createdAt: '', updatedAt: '',
  } : targetShop!;

  const [form, setForm] = useState(initialData!);
  const [courses, setCourses] = useState(initialData?.courses || []);
  const [tagsStr, setTagsStr] = useState(initialData?.tags?.join(', ') || '');

  // 이미지 업로드 상태 (base64 미리보기)
  const [thumbPreview, setThumbPreview] = useState<string>(initialData?.thumbnailUrl || '');
  const [bannerPreview, setBannerPreview] = useState<string>(initialData?.bannerUrl || '');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.images || []);
  const thumbRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<string> =>
    new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(file); });

  if (!form) return <div className="p-10 text-center text-gray-500">업소를 찾을 수 없습니다.</div>;
  if (!isNew && currentUser.role === 'OWNER' && targetShop?.ownerId !== currentUser.id) {
    return <div className="p-10 text-center text-red-500 font-bold">권한이 없습니다. 본인 소유의 업소만 수정 가능합니다.</div>;
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rcode = e.target.value;
    const rlabel = REGIONS.find(r => r.code === rcode)?.label ?? '';
    setForm({ ...form, region: rcode, regionLabel: rlabel, subRegion: '', subRegionLabel: '' });
  };
  const currentDistricts = DISTRICTS[form.region] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      alert('새로운 업소가 성공적으로 등록되었습니다.');
    } else {
      alert('수정된 업체 정보가 성공적으로 저장되었습니다.');
    }
    router.push('/admin/shops');
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() !== '' && form.region !== '';
    if (step === 1) return form.phone.trim() !== '' && form.hours.trim() !== '';
    return true;
  };

  return (
    <div className="max-w-[860px] space-y-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin/shops" className="p-1 hover:bg-gray-200 rounded text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-gray-800">{isNew ? '업소 등록' : '업소 수정'}</h1>
      </div>

      {/* ===== 단계 인디케이터 ===== */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className={clsx('step-item', i === step && 'active', i < step && 'completed', 'shrink-0')}
              >
                <div className="step-num">{i < step ? '✓' : i + 1}</div>
                <div className="hidden sm:block">
                  <div className="text-[11px]">{s.label}</div>
                  <div className="text-[9px] opacity-70">{s.desc}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={clsx('step-connector flex-1', i < step && 'active')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ===== STEP 0: 기본 정보 ===== */}
        {step === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-black text-gray-800 pb-2 border-b border-gray-100">① 기본 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>업소명 *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={ipt} placeholder="예: 강남 힐링스파" />
              </div>
              <div>
                <label className={lbl}>슬러그 (URL 영문) *</label>
                <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={ipt} placeholder="예: gangnam-healing-spa" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>지역 *</label>
                <select value={form.region} onChange={handleRegionChange} className={ipt}>
                  {REGIONS.filter(r => r.code !== 'all').map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>상세 지역구</label>
                <select
                  value={form.subRegion || ''}
                  onChange={e => setForm({ ...form, subRegion: e.target.value, subRegionLabel: currentDistricts.find(d => d.code === e.target.value)?.label ?? '' })}
                  className={ipt}
                  disabled={currentDistricts.length === 0}
                >
                  <option value="">선택 (없음)</option>
                  {currentDistricts.filter(d => d.code !== 'all').map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>테마 *</label>
                <select value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value, themeLabel: THEMES.find(t => t.code === e.target.value)?.label ?? '' })} className={ipt}>
                  {THEMES.filter(t => t.code !== 'all').map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>메인 캐치프레이즈 (목록 노출)</label>
              <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className={ipt} placeholder="예: 강남 최고의 프리미엄 스웨디시 마사지" />
            </div>
          </div>
        )}

        {/* ===== STEP 1: 상세 정보 ===== */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-black text-gray-800 pb-2 border-b border-gray-100">② 상세 정보</h2>
            <div>
              <RichTextEditor
                label="상세 설명"
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                helperText="업소 소개, 특장점, 서비스 안내 등을 글꼴, 색상, 정렬 기능과 함께 자유롭게 작성해주세요."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>연락처 *</label>
                <input type="text" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={ipt} placeholder="010-0000-0000" />
              </div>
              <div>
                <label className={lbl}>영업시간 *</label>
                <input type="text" required value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className={ipt} placeholder="매일 10:00 - 23:00" />
              </div>
            </div>
            <div>
              <label className={lbl}>주소</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={ipt} placeholder="서울특별시 강남구 테헤란로 123" />
            </div>
          </div>
        )}

        {/* ===== STEP 2: 코스 등록 ===== */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-base font-black text-gray-800">③ 코스/요금표</h2>
              <button type="button"
                onClick={() => setCourses([...courses, { name: '', price: '', duration: '', description: '' }])}
                className="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold">
                <Plus className="w-3.5 h-3.5" /> 코스 추가
              </button>
            </div>
            <div className="space-y-3">
              {courses.map((course, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="코스명" value={course.name}
                      onChange={e => { const n = [...courses]; n[idx].name = e.target.value; setCourses(n); }}
                      className={ipt} />
                    <input type="text" placeholder="시간 (예: 60분)" value={course.duration}
                      onChange={e => { const n = [...courses]; n[idx].duration = e.target.value; setCourses(n); }}
                      className={ipt} />
                    <input type="text" placeholder="요금 (예: 70,000원)" value={course.price}
                      onChange={e => { const n = [...courses]; n[idx].price = e.target.value; setCourses(n); }}
                      className={ipt} />
                  </div>
                  <button type="button" onClick={() => setCourses(courses.filter((_, i) => i !== idx))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  + 코스 추가 버튼을 눌러 요금표를 등록하세요
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 3: 태그·이미지 ===== */}
        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-black text-gray-800 pb-2 border-b border-gray-100">④ 태그·이미지</h2>
            <div>
              <label className={lbl}>태그 (쉼표로 구분)</label>
              <input type="text" value={tagsStr} onChange={e => setTagsStr(e.target.value)} className={ipt} placeholder="예: 무료주차, 카드결제, 여성전용" />
              <p className="text-[11px] text-gray-400 mt-1">미리보기 태그: {tagsStr.split(',').filter(t => t.trim()).map(t => (
                <span key={t} className="inline-block bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] mr-1">{t.trim()}</span>
              ))}</p>
            </div>
            {/* 썸네일 */}
            <div>
              <label className={lbl}>썸네일 이미지 <span className="text-gray-400 font-normal">(1:1 비율 권장)</span></label>
              <div
                onClick={() => thumbRef.current?.click()}
                className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-red-400 transition-colors bg-gray-50 flex items-center justify-center"
              >
                {thumbPreview ? (
                  <img src={thumbPreview} alt="썸네일" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-[11px]">클릭하여 업로드</div>
                  </div>
                )}
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b64 = await readFile(f);
                  setThumbPreview(b64);
                  setForm(prev => ({ ...prev, thumbnailUrl: b64 }));
                }}
              />
              {thumbPreview && (
                <button type="button" onClick={() => { setThumbPreview(''); setForm(prev => ({ ...prev, thumbnailUrl: '' })); }}
                  className="mt-1 text-[11px] text-red-400 hover:text-red-600">삭제</button>
              )}
            </div>

            {/* 배너 */}
            <div>
              <label className={lbl}>배너 이미지 <span className="text-gray-400 font-normal">(2:1 비율 권장)</span></label>
              <div
                onClick={() => bannerRef.current?.click()}
                className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-red-400 transition-colors bg-gray-50 flex items-center justify-center"
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="배너" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-2xl mb-1">🌄</div>
                    <div className="text-[11px]">클릭하여 배너 업로드</div>
                  </div>
                )}
              </div>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b64 = await readFile(f);
                  setBannerPreview(b64);
                  setForm(prev => ({ ...prev, bannerUrl: b64 }));
                }}
              />
              {bannerPreview && (
                <button type="button" onClick={() => { setBannerPreview(''); setForm(prev => ({ ...prev, bannerUrl: '' })); }}
                  className="mt-1 text-[11px] text-red-400 hover:text-red-600">삭제</button>
              )}
            </div>

            {/* 걤러리 */}
            <div>
              <label className={lbl}>걤러리 사진 <span className="text-gray-400 font-normal">(여러 장 선택 가능)</span></label>
              <div className="flex flex-wrap gap-2">
                {galleryPreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img src={src} alt={`걤러리${i+1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const next = galleryPreviews.filter((_, idx) => idx !== i);
                        setGalleryPreviews(next);
                        setForm(prev => ({ ...prev, images: next }));
                      }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                    >✕</button>
                  </div>
                ))}
                <div
                  onClick={() => galleryRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors bg-gray-50 text-gray-400 text-2xl"
                >+</div>
              </div>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                onChange={async e => {
                  const files = Array.from(e.target.files || []);
                  const b64s = await Promise.all(files.map(readFile));
                  const next = [...galleryPreviews, ...b64s];
                  setGalleryPreviews(next);
                  setForm(prev => ({ ...prev, images: next }));
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        )}

        {/* ===== STEP 4: 미리보기 ===== */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-base font-black text-gray-800 pb-2 border-b border-gray-100 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" /> 미리보기
              </h2>

              {/* 카드 미리보기 */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 mb-2">목록 카드 미리보기</p>
                <div className="max-w-[200px]">
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center text-5xl">
                      {themeEmoji[form.theme] ?? '✨'}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{form.name || '업소명'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span className="text-[11px] text-red-600">{form.regionLabel}</span>
                        {form.subRegionLabel && <span className="text-[10px] text-gray-400">{form.subRegionLabel}</span>}
                      </div>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded">#{form.themeLabel}</span>
                        {tagsStr.split(',').filter(t => t.trim()).slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{t.trim()}</span>
                        ))}
                      </div>
                      {courses[0] && (
                        <div className="mt-2 pt-1.5 border-t border-gray-100 text-right">
                          <span className="text-xs font-bold text-red-600">{courses[0].price}~</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 정보 요약 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <p className="text-xs font-bold text-gray-500 border-b pb-1">기본 정보</p>
                  <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">업소명</span><span className="font-semibold">{form.name || '-'}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">지역</span><span>{form.regionLabel} {form.subRegionLabel}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">테마</span><span>{form.themeLabel}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">슬러그</span><span className="text-blue-600 font-mono text-xs">/shop/{form.slug || '...'}</span></div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-xs font-bold text-gray-500 border-b pb-1">연락·운영</p>
                  <div className="flex gap-2"><Phone className="w-4 h-4 text-gray-400 shrink-0" /><span>{form.phone || '-'}</span></div>
                  <div className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 shrink-0" /><span>{form.hours || '-'}</span></div>
                  <div className="flex gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-xs">{form.address || '-'}</span></div>
                </div>
              </div>

              {courses.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 border-b pb-1 mb-2">코스 요금</p>
                  <div className="space-y-1">
                    {courses.map((c, i) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                        <span>{c.name || `코스 ${i + 1}`} <span className="text-gray-400 text-xs">({c.duration})</span></span>
                        <span className="font-bold text-red-600">{c.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 하단 버튼 ===== */}
        <div className="flex gap-2 justify-between mt-4">
          <div>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/admin/shops" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</Link>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-1 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">
                <Save className="w-4 h-4" /> 저장 완료
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
