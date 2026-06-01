'use client';

import { useState } from 'react';
import { Settings, Save, Globe, Info, Layout, Phone, Building, Type, FileText } from 'lucide-react';
import { MOCK_SITE_SETTINGS, MOCK_HOME_SEO } from '@/lib/mockData';
import { SiteSettings, HomeSeoContent } from '@/lib/types';
import clsx from 'clsx';

export default function AdminSettingsPage() {
  // 두 가지 종류의 설정을 각각 관리
  const [siteForm, setSiteForm] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [seoForm, setSeoForm] = useState<HomeSeoContent>(MOCK_HOME_SEO);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // 실제 운영 시에는 여기서 API 호출
    setTimeout(() => {
      setIsSaving(false);
      alert('모든 설정이 성공적으로 저장되었습니다.');
    }, 800);
  };

  const ipt = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 transition-all";
  const lbl = "flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5";

  return (
    <div className="max-w-[1200px] space-y-10 pb-10">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md py-4 z-20 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D4A373]" /> 사이트 통합 관리 설정
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95",
            isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-[#D4A373] hover:bg-[#C29262] text-white"
          )}
        >
          <Save className={clsx("w-4 h-4", isSaving && "animate-spin")} />
          {isSaving ? "저장 중..." : "전체 설정 저장"}
        </button>
      </div>

      {/* ===== 섹션 1: 사이드 기본 모듈 설정 ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-sky-600 pl-3">
          <Globe className="w-5 h-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">1. 사이트 기본 모듈 설정</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-sm text-gray-700">기본 브랜드 설정</div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={lbl}>사이트 이름</label>
                  <input
                    type="text"
                    value={siteForm.siteName}
                    onChange={e => setSiteForm({ ...siteForm, siteName: e.target.value })}
                    className={ipt}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>사이트 제목 (SEO)</label>
                    <input
                      type="text"
                      value={siteForm.siteTitle}
                      onChange={e => setSiteForm({ ...siteForm, siteTitle: e.target.value })}
                      className={ipt}
                    />
                  </div>
                  <div>
                    <label className={lbl}>사이트 영문명/설명</label>
                    <input
                      type="text"
                      value={siteForm.siteDescription}
                      onChange={e => setSiteForm({ ...siteForm, siteDescription: e.target.value })}
                      className={ipt}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-sm text-gray-700">홈 화면 상단 배너 문구</div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={lbl}>배너 메인 강조 텍스트</label>
                  <input
                    type="text"
                    value={siteForm.heroMainText}
                    onChange={e => setSiteForm({ ...siteForm, heroMainText: e.target.value })}
                    className={ipt}
                  />
                </div>
                <div>
                  <label className={lbl}>배너 하단 안내 텍스트</label>
                  <input
                    type="text"
                    value={siteForm.heroSubText}
                    onChange={e => setSiteForm({ ...siteForm, heroSubText: e.target.value })}
                    className={ipt}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-sm text-gray-700">연락처 및 푸터 정보</div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={lbl}>대표 연락처</label>
                  <input
                    type="text"
                    value={siteForm.contactPhone}
                    onChange={e => setSiteForm({ ...siteForm, contactPhone: e.target.value })}
                    className={ipt}
                  />
                </div>
                <div>
                  <label className={lbl}>푸터 사업자 정보</label>
                  <textarea
                    rows={4}
                    value={siteForm.footerInfo}
                    onChange={e => setSiteForm({ ...siteForm, footerInfo: e.target.value })}
                    className={ipt}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* ===== 섹션 2: 홈페이지 하단 SEO 문구 관리 ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-[#D4A373] pl-3">
          <Layout className="w-5 h-5 text-gray-800" />
          <h2 className="text-lg font-black text-gray-800">2. 홈페이지 하단 SEO 문구 관리</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-xs text-[#D4A373]">첫 번째 블록</span>
              <Type className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="p-4 space-y-3">
              <input value={seoForm.section1Title} onChange={e => setSeoForm({...seoForm, section1Title: e.target.value})} className={ipt} placeholder="제목 입력" />
              <textarea value={seoForm.section1Content} onChange={e => setSeoForm({...seoForm, section1Content: e.target.value})} rows={5} className={ipt} placeholder="내용 입력" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-xs text-[#D4A373]">두 번째 블록</span>
              <Type className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="p-4 space-y-3">
              <input value={seoForm.section2Title} onChange={e => setSeoForm({...seoForm, section2Title: e.target.value})} className={ipt} placeholder="제목 입력" />
              <textarea value={seoForm.section2Content} onChange={e => setSeoForm({...seoForm, section2Content: e.target.value})} rows={5} className={ipt} placeholder="내용 입력" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-xs text-blue-600">세 번째 블록</span>
              <Type className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="p-4 space-y-3">
              <input value={seoForm.section3Title} onChange={e => setSeoForm({...seoForm, section3Title: e.target.value})} className={ipt} placeholder="제목 입력" />
              <textarea value={seoForm.section3Content} onChange={e => setSeoForm({...seoForm, section3Content: e.target.value})} rows={5} className={ipt} placeholder="내용 입력" />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#FEFAE0] border border-[#D4A373] border-opacity-20 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-[#D4A373] shrink-0 mt-0.5" />
        <div className="text-xs text-[#5F4B32] leading-relaxed">
          <p className="font-bold mb-1">관리 지침</p>
          <p>1번 섹션은 사이트 전체의 기본 레이아웃과 배너 문구에 영향을 주며, 2번 섹션은 홈 화면 최하단의 마케팅용 SEO 텍스트를 구성합니다. 모든 항목은 입력 즉시 시스템에 반영됩니다.</p>
        </div>
      </div>
    </div>
  );
}
