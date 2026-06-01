'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Store } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'user' | 'owner'>('user');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // 로그인 성공 후 권한에 따른 분기 처리
      if (activeTab === 'owner') {
        router.push('/admin/shops');
      } else {
        router.push('/');
      }
    }, 1000);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Tab Menu */}
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => { setActiveTab('user'); setForm({ email: '', password: '' }); setShowPw(false); }}
              className={clsx(
                "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors",
                activeTab === 'user' ? "text-red-600 border-b-2 border-red-600 bg-white" : "text-gray-400 bg-gray-50 hover:bg-gray-100"
              )}>
              <User className="w-4 h-4"/> 일반 고객
            </button>
            <button 
              onClick={() => { setActiveTab('owner'); setForm({ email: '', password: '' }); setShowPw(false); }}
              className={clsx(
                "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors",
                activeTab === 'owner' ? "text-red-600 border-b-2 border-red-600 bg-white" : "text-gray-400 bg-gray-50 hover:bg-gray-100"
              )}>
              <Store className="w-4 h-4"/> 입점사(업체)
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-black text-lg">힐</span>
              </div>
              <h1 className="text-lg font-black text-gray-800 mb-1">
                {activeTab === 'user' ? '일반 회원 로그인' : '사장님 로그인'}
              </h1>
              <p className="text-xs text-gray-400">
                {activeTab === 'user' ? '힐링찾기 계정으로 안전하게 로그인하세요' : '입점사 관리 시스템에 접속합니다'}
              </p>
            </div>



            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder={activeTab === 'user' ? "이메일" : "가입하신 대표 이메일"}
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="비밀번호"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded hover:bg-red-700 disabled:opacity-60 transition-colors">
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-4 flex justify-between items-center text-xs">
              <Link href="/auth/forgot" className="text-gray-500 hover:text-red-600">비밀번호 찾기</Link>
              <Link href="/auth/register" className="text-red-600 font-bold hover:underline">회원가입 →</Link>
            </div>
            
            {activeTab === 'user' && (
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <Link href="/admin" className="text-[11px] text-gray-400 hover:text-red-600 transition-colors">관리자 전용 로그인</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
