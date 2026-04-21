'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Store, User } from 'lucide-react';
import clsx from 'clsx';

type LoginResult = {
  user?: {
    role: 'ADMIN' | 'OWNER' | 'USER';
  };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'user' | 'owner'>('user');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFormState = (tab: 'user' | 'owner') => {
    setActiveTab(tab);
    setForm({ email: '', password: '' });
    setShowPw(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as LoginResult;

      if (!response.ok || !result.user) {
        setError(result.error ?? '로그인에 실패했습니다.');
        return;
      }

      if (result.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (result.user.role === 'OWNER') {
        router.push('/admin/shops');
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => resetFormState('user')}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 py-4 text-sm font-bold transition-colors',
                activeTab === 'user'
                  ? 'border-b-2 border-red-600 bg-white text-red-600'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100',
              )}
            >
              <User className="h-4 w-4" /> 일반 고객
            </button>
            <button
              onClick={() => resetFormState('owner')}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 py-4 text-sm font-bold transition-colors',
                activeTab === 'owner'
                  ? 'border-b-2 border-red-600 bg-white text-red-600'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100',
              )}
            >
              <Store className="h-4 w-4" /> 입점사(업체)
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-red-600">
                <span className="text-lg font-black text-white">힐</span>
              </div>
              <h1 className="mb-1 text-lg font-black text-gray-800">
                {activeTab === 'user' ? '일반 회원 로그인' : '사장님 로그인'}
              </h1>
              <p className="text-xs text-gray-400">
                {activeTab === 'user'
                  ? '힐링찾기 계정으로 안전하게 로그인하세요'
                  : '입점사 관리 시스템에 접속합니다'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder={activeTab === 'user' ? '이메일' : '가입하신 대표 이메일'}
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              />
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="비밀번호"
                  className="w-full rounded border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
              {error ? <p className="text-xs text-red-600">{error}</p> : null}
            </form>

            <div className="mt-4 flex items-center justify-between text-xs">
              <Link href="/auth/forgot" className="text-gray-500 hover:text-red-600">
                비밀번호 찾기
              </Link>
              <Link href="/auth/register" className="font-bold text-red-600 hover:underline">
                회원가입 →
              </Link>
            </div>

            {activeTab === 'user' ? (
              <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                <Link
                  href="/admin"
                  className="text-[11px] text-gray-400 transition-colors hover:text-red-600"
                >
                  관리자 전용 로그인
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
