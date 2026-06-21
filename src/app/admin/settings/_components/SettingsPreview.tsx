'use client';
import React, { useEffect, useState } from 'react';
import { SiteSettings, HomeSeoContent } from '@/lib/types';
import { LayoutTemplate, Phone, Globe, Monitor, Smartphone } from 'lucide-react';
import clsx from 'clsx';

interface SettingsPreviewProps {
  siteForm: SiteSettings;
  seoForm: HomeSeoContent;
}

export function SettingsPreview({ siteForm, seoForm }: SettingsPreviewProps) {
  // 입력값 변경 시 하이라이트 효과를 주기 위한 커스텀 훅
  const useHighlight = (value: string) => {
    const [highlight, setHighlight] = useState(false);
    useEffect(() => {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 800);
      return () => clearTimeout(timer);
    }, [value]);
    return highlight;
  };

  const hlSiteName = useHighlight(siteForm.siteName);
  const hlMainText = useHighlight(siteForm.heroMainText);
  const hlSubText = useHighlight(siteForm.heroSubText);
  const hlS1T = useHighlight(seoForm.section1Title);
  const hlS1C = useHighlight(seoForm.section1Content);
  const hlS2T = useHighlight(seoForm.section2Title);
  const hlS2C = useHighlight(seoForm.section2Content);
  const hlS3T = useHighlight(seoForm.section3Title);
  const hlS3C = useHighlight(seoForm.section3Content);
  const hlContact = useHighlight(siteForm.contactPhone);
  const hlFooter = useHighlight(siteForm.footerInfo);

  // 하이라이트 CSS 클래스 반환 헬퍼 (차분한 관리자 페이지 톤)
  const getHlClass = (isActive: boolean) => 
    clsx(
      "transition-colors duration-700 rounded-sm",
      isActive ? "bg-[#D4A373]/20 text-gray-900 px-1 -mx-1" : "bg-transparent text-inherit"
    );

  return (
    <div className="sticky top-6 flex flex-col space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-gray-600 font-bold">
          <LayoutTemplate className="w-5 h-5 text-[#D4A373]" />
          <h2>라이브 미리보기 (구조형 목업)</h2>
        </div>
        <div className="flex gap-2">
          <Monitor className="w-4 h-4 text-gray-400" />
          <Smartphone className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[600px] overflow-y-auto custom-scrollbar">
        
        {/* 1. Header Preview */}
        <header className="border-b border-gray-100 bg-white p-4 flex items-center justify-between shrink-0">
          <div className={clsx("font-black text-lg text-gray-800 tracking-tight", getHlClass(hlSiteName))}>
            {siteForm.siteName || '사이트 이름'}
          </div>
          <div className="flex gap-3 text-xs text-gray-400 font-medium">
            <div className="w-8 h-2 bg-gray-100 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-100 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-100 rounded-full"></div>
          </div>
        </header>

        {/* 2. Hero Banner Preview */}
        <div className="bg-gray-50 flex flex-col items-center justify-center py-16 px-6 text-center border-b border-gray-100 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4A373]/5 to-transparent"></div>
          <h2 className={clsx("text-2xl font-bold text-gray-800 mb-3 drop-shadow-sm relative z-10", getHlClass(hlMainText))}>
            {siteForm.heroMainText || '메인 배너 텍스트'}
          </h2>
          <p className={clsx("text-sm text-gray-500 relative z-10", getHlClass(hlSubText))}>
            {siteForm.heroSubText || '서브 배너 텍스트'}
          </p>
        </div>

        {/* 3. SEO / Content Preview */}
        <div className="bg-white p-6 space-y-4 flex-1">
          <div className="text-xs font-bold text-gray-400 mb-2">메인홈 하단 SEO 섹션 (푸터 위)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
              <h3 className={clsx("font-bold text-sm text-gray-700 mb-2", getHlClass(hlS1T))}>
                {seoForm.section1Title || '섹션1 제목'}
              </h3>
              <p className={clsx("text-xs text-gray-500 leading-relaxed", getHlClass(hlS1C))}>
                {seoForm.section1Content || '섹션1 내용이 여기에 표시됩니다.'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
              <h3 className={clsx("font-bold text-sm text-gray-700 mb-2", getHlClass(hlS2T))}>
                {seoForm.section2Title || '섹션2 제목'}
              </h3>
              <p className={clsx("text-xs text-gray-500 leading-relaxed", getHlClass(hlS2C))}>
                {seoForm.section2Content || '섹션2 내용이 여기에 표시됩니다.'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
              <h3 className={clsx("font-bold text-sm text-gray-700 mb-2", getHlClass(hlS3T))}>
                {seoForm.section3Title || '섹션3 제목'}
              </h3>
              <p className={clsx("text-xs text-gray-500 leading-relaxed", getHlClass(hlS3C))}>
                {seoForm.section3Content || '섹션3 내용이 여기에 표시됩니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Preview */}
        <footer className="bg-gray-800 text-gray-400 p-6 text-xs shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-gray-200 font-bold">
              <Globe className="w-4 h-4" />
              <span className={getHlClass(hlSiteName)}>{siteForm.siteName || '사이트 이름'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Phone className="w-3.5 h-3.5" />
              <span className={getHlClass(hlContact)}>고객센터: {siteForm.contactPhone || '전화번호'}</span>
            </div>
            <div className={clsx("whitespace-pre-wrap leading-relaxed opacity-70", getHlClass(hlFooter))}>
              {siteForm.footerInfo || '사업자 정보가 여기에 표시됩니다.'}
            </div>
          </div>
        </footer>

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db; 
        }
      `}</style>
    </div>
  );
}
