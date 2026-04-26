'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Lock, Phone, Store, UserCircle } from 'lucide-react';

type OwnerRegisterResult = {
  error?: string;
};

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    name: '',
    businessName: '',
    businessNumber: '',
    phone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSubmitted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push('/admin/shops');
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [isSubmitted, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.id,
          password: formData.password,
          businessName: formData.businessName,
          businessNumber: formData.businessNumber,
          phone: formData.phone,
        }),
      });
      const result = (await response.json()) as OwnerRegisterResult;

      if (!response.ok) {
        setError(result.error ?? '업주 회원 가입 요청에 실패했습니다.');
        return;
      }

      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">입점 신청이 완료되었습니다</h2>
            <p className="text-gray-600">
              업체등록 페이지로 이동합니다...
              <br />
              <span className="text-sm text-gray-400">(자동 이동 중)</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/shops')}
            className="inline-block w-full rounded-lg bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            업체등록 바로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
            <span className="text-xl font-black text-white">힐</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">입점사 회원가입</h1>
          <p className="mt-2 text-sm text-gray-500">간단한 정보 입력 후 힐링 디렉토리에 입점하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">아이디</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="id"
                required
                value={formData.id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="아이디 입력"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="passwordConfirm"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">대표자명</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="홍길동"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">업체명</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="강남 힐링스파"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">사업자 등록번호</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="businessNumber"
                required
                value={formData.businessNumber}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="123-45-67890"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">대표 연락처</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
            {loading ? '가입 신청 중...' : '회원가입 후 업체등록 진행'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="font-medium text-red-600 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}