'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import clsx from 'clsx';

export default function RegisterUserPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', id: '', password: '' });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false
  });
  const [modal, setModal] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreements.terms || !agreements.privacy) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };

  const openModal = (type: 'terms' | 'privacy') => {
    if (type === 'terms') {
      setModal({
        open: true,
        title: '이용약관',
        content: '[이용약관]\n\n제 1조 (목적)\n본 약관은 힐링찾기가 제공하는 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n제 2조 (서비스의 제공 및 이용)\n1. 회사는 회원에게 테라피 업소 정보 제공, 예약 대행 등의 플랫폼 서비스를 제공합니다.\n2. 서비스 이용은 24시간 가동을 원칙으로 하되, 시스템 점검 등 경영상 이유로 중단될 수 있습니다.'
      });
    } else {
      setModal({
        open: true,
        title: '개인정보 수집 및 이용 동의',
        content: '[개인정보 수집 및 이용 동의]\n\n■ 수집항목: 닉네임, 아이디, 비밀번호\n■ 목적: 회원관리 및 서비스 제공\n■ 보관기간: 회원 탈퇴 시 즉시 파기'
      });
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-black text-gray-800 mb-2">가입 완료!</h1>
          <p className="text-sm text-gray-500 mb-6">힐링찾기 일반 회원이 되신 것을 환영합니다.</p>
          <Link href="/auth/login" className="px-6 py-2.5 bg-sky-600 text-white text-sm font-bold rounded hover:bg-sky-700 transition-colors">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const isRequiredChecked = agreements.terms && agreements.privacy;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded bg-[#D4A373] flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-lg">힐</span>
            </div>
            <h1 className="text-lg font-black text-gray-800 mb-1">일반 고객 회원가입</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="닉네임"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#D4A373]" />
            <input type="text" required value={form.id}
              onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
              placeholder="아이디"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#D4A373]" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="비밀번호 (8자 이상)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#D4A373] pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 동의 영역 */}
            <div className="terms-box pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={agreements.terms}
                    onChange={e => setAgreements(p => ({ ...p, terms: e.target.checked }))}
                    className="accent-[#D4A373]" />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">[필수] 이용약관 동의</span>
                </label>
                <button type="button" onClick={() => openModal('terms')} className="text-[11px] text-gray-400 hover:text-[#D4A373] underline">보기</button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={agreements.privacy}
                    onChange={e => setAgreements(p => ({ ...p, privacy: e.target.checked }))}
                    className="accent-[#D4A373]" />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">[필수] 개인정보 수집 및 이용 동의</span>
                </label>
                <button type="button" onClick={() => openModal('privacy')} className="text-[11px] text-gray-400 hover:text-[#D4A373] underline">보기</button>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={agreements.marketing}
                    onChange={e => setAgreements(p => ({ ...p, marketing: e.target.checked }))}
                    className="accent-[#D4A373]" />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">[선택] 마케팅 정보 수신 동의</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading || !isRequiredChecked}
              className={clsx(
                "w-full py-2.5 font-bold text-sm rounded transition-all shadow-sm active:scale-95",
                isRequiredChecked ? "bg-[#D4A373] text-white hover:bg-[#C29262]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}>
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs">
            <span className="text-gray-400">이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-[#D4A373] font-semibold hover:underline transition-colors">로그인</Link>
          </div>
        </div>
      </div>

      {/* 약관 보기 모달 */}
      {modal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-800">{modal.title}</h2>
              <button 
                onClick={() => setModal({ ...modal, open: false })}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                {modal.content}
              </div>
            </div>
            <div className="p-3 border-t border-gray-100 text-center">
              <button 
                onClick={() => setModal({ ...modal, open: false })}
                className="w-full py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
