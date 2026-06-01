'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Send, CheckCircle2, Phone, Building2, MapPin, Tag } from 'lucide-react';
import { REGIONS, DISTRICTS, THEMES } from '@/lib/types';

export default function PartnershipPage() {
  const [form, setForm] = useState({
    shopName: '',
    region: 'seoul',
    subRegion: '',
    theme: 'swedish',
    contactName: '',
    phone: '',
    kakaoId: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentDistricts = DISTRICTS[form.region] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 실제 API 연동 시뮬레이션
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 sm:p-4 rounded-full">
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 animate-bounce" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">입점 문의 접수 완료!</h1>
        <p className="text-gray-600 mb-10 leading-relaxed">
          보내주신 소중한 입점 문의가 정상적으로 접수되었습니다.<br />
          담당자가 확인 후 1~2일 내에 기재해주신 연락처로 안내해 드리겠습니다.
        </p>
        <Link href="/" className="inline-block px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-3 py-6">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">입점 문의</span>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* 상단 배너 영역 */}
        <div className="bg-gradient-to-br from-red-600 to-rose-500 p-6 sm:p-8 text-white text-center">
          <h1 className="text-xl sm:text-3xl font-black mb-2 sm:mb-3 italic tracking-tight uppercase">Partnership</h1>
          <p className="text-xs sm:text-base opacity-90 font-medium leading-relaxed">
            대한민국 NO.1 마사지 플랫폼과<br className="sm:hidden" /> 함께 성장할 파트너를 모십니다.
          </p>
        </div>

        <div className="p-5 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 업체명 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  <Building2 className="w-3.5 h-3.5 text-red-500" /> 업체명 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="정확한 업체명을 입력해 주세요"
                  value={form.shopName}
                  onChange={e => setForm(p => ({ ...p, shopName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>

              {/* 담당자 성함 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  담당자 성함 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="성함을 입력해 주세요"
                  value={form.contactName}
                  onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 지역 선택 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> 지역 *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={form.region}
                      onChange={e => setForm(p => ({ ...p, region: e.target.value, subRegion: '' }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {REGIONS.filter(r => r.code !== 'all').map(r => (
                        <option key={r.code} value={r.code}>{r.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={form.subRegion}
                      required={currentDistricts.length > 0}
                      onChange={e => setForm(p => ({ ...p, subRegion: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="">상세 구/군</option>
                      {currentDistricts.filter(d => d.code !== 'all').map(d => (
                        <option key={d.code} value={d.code}>{d.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주요 테마 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  <Tag className="w-3.5 h-3.5 text-red-500" /> 주요 테마 *
                </label>
                <div className="relative">
                  <select
                    value={form.theme}
                    onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {THEMES.filter(t => t.code !== 'all').map(t => (
                      <option key={t.code} value={t.code}>{t.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 연락처 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  <Phone className="w-3.5 h-3.5 text-red-500" /> 휴대폰 번호 *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>

              {/* 카카오톡 ID */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 ml-1">
                  카카오톡 ID (선택)
                </label>
                <input
                  type="text"
                  placeholder="카톡 ID를 남겨주시면 빠른 상담이 가능합니다"
                  value={form.kakaoId}
                  onChange={e => setForm(p => ({ ...p, kakaoId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 문의 내용 */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 ml-1">기타 문의사항</label>
              <textarea
                rows={4}
                placeholder="입점 패키지 문의, 특별 요청 사항 등을 자유롭게 기재해 주세요."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <input type="checkbox" required id="privacy" className="mt-1 accent-red-600" />
              <label htmlFor="privacy" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                개인정보 수집 및 이용에 동의합니다. (작성하신 정보는 입점 상담 및 안내 목적으로만 사용되며, 1년간 보관 후 파기됩니다.)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-lg hover:bg-red-700 transition-all shadow-xl hover:shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" /> 입점 문의하기
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Direct Call</p>
                <p className="text-sm font-black text-gray-800">010-1234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="bg-yellow-400 p-2 rounded-full text-white">
                💬
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kakao ID</p>
                <p className="text-sm font-black text-gray-800">healing_help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
