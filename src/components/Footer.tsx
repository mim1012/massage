import Link from 'next/link';
import { MOCK_SITE_SETTINGS } from '@/lib/mockData';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-6 pb-16 md:pb-0">
      {/* 푸터 상단 링크 바 */}
      <div className="bg-[#f8f8f8] border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 text-[13px] text-gray-600 font-medium">
          <Link href="/ad" className="hover:text-gray-900">광고안내</Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms" className="hover:text-gray-900">이용약관</Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="font-bold hover:text-gray-900">개인정보처리방침</Link>
          <span className="text-gray-300">|</span>
          <Link href="/youth" className="hover:text-gray-900">청소년보호정책</Link>
          <span className="text-gray-300">|</span>
          <Link href="/mobile" className="hover:text-gray-900">모바일웹</Link>
          <span className="text-gray-300">|</span>
          <Link href="/rss" className="bg-[#ff6600] text-white p-0.5 rounded-sm hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
          </Link>
        </div>
      </div>

      {/* 푸터 메인 정보 영역 */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          
          {/* 좌측: 로고 및 사업자 정보 */}
          <div className="flex-1 space-y-4">
            {/* 로고 대체 (원본 텍스트 기반) */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-sky-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">{MOCK_SITE_SETTINGS.siteName[0]}</span>
              </div>
              <div className="leading-tight">
                <span className="text-gray-900 font-black text-xl tracking-tight">{MOCK_SITE_SETTINGS.siteName}</span>
                <span className="text-sky-500 font-bold text-[10px] block -mt-1 ml-0.5">#마사지 커뮤니티</span>
              </div>
            </div>

            <div className="text-[12px] text-gray-500 leading-relaxed uppercase tracking-tight font-medium">
              <p>{MOCK_SITE_SETTINGS.footerInfo}</p>
              <p className="mt-4 font-normal">Copyright 2018 {MOCK_SITE_SETTINGS.siteName}. All rights reseved.</p>
            </div>
          </div>

          {/* 우측: 고객센터 및 SNS */}
          <div className="md:w-[450px] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">고객센터</h3>
              <div className="text-[32px] font-black text-[#0078d7] leading-none mb-4 -ml-0.5 tracking-tight">
                {MOCK_SITE_SETTINGS.contactPhone}
              </div>
              <div className="text-[12px] text-gray-500 space-y-1.5 font-medium tracking-tight">
                <p>평일 : 월~금 09:00 ~ 18:00</p>
                <p>점심시간 : 12:00 ~ 13:30 (주말, 공휴일 휴무)</p>
                <p>E-MAIL : help@beaulead.co.kr</p>
              </div>
            </div>
            
            {/* SNS 아이콘 */}
            <div className="flex items-center gap-3 mt-6">
              <Link href="#" className="w-10 h-10 rounded-full bg-[#ff0000] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-[#03c75a] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
