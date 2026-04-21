'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

type RegisterResult = {
  error?: string;
};

export default function RegisterUserPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', agree: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/register/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    });
    const result = (await response.json()) as RegisterResult;
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? '회원가입에 실패했습니다.');
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-black text-gray-800 mb-2">회원가입이 완료되었습니다</h1>
          <p className="text-sm text-gray-500 mb-6">
            계정이 생성되었습니다. 방금 등록한 정보로 바로 로그인할 수 있습니다.
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <h1 className="text-lg font-black text-gray-800 mb-1">일반 회원 가입</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="이름"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="이메일"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="비밀번호"
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) =>
                  setForm((current) => ({ ...current, agree: event.target.checked }))
                }
                className="mt-0.5 accent-red-600"
              />
              <span className="text-xs text-gray-500">기본 이용약관에 동의합니다.</span>
            </label>
            <button
              type="submit"
              disabled={loading || !form.agree}
              className="w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '계정을 생성하는 중...' : '회원가입'}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
          <div className="mt-4 text-center text-xs">
            <span className="text-gray-400">이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-red-600 font-semibold">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
