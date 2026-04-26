'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Lock, Mail, Phone, Store, UserCircle } from 'lucide-react';

type OwnerRegisterResult = {
  error?: string;
};

export default function RegisterOwnerPage() {
  const [formData, setFormData] = useState({
    email: '',
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
          email: formData.email,
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
      <div className="min-h-screen bg-gray-50 px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-[600px] text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3 sm:p-4">
              <Store className="h-12 w-12 text-blue-600 sm:h-16 sm:w-16" />
            </div>
          </div>
          <h1 className="mb-4 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            업주 가입 요청이 접수되었습니다
          </h1>
          <p className="mb-10 leading-relaxed text-gray-600">
            보내주신 가입 신청이 정상적으로 접수되었습니다.
            <br />
            관리자 승인 후 로그인 및 업소 관리가 가능하며, 검토 결과는 입력하신 연락처로 안내해 드리겠습니다.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-red-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-red-200"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
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
            <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
                placeholder="owner@example.com"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? '가입 신청 중...' : '회원가입 후 승인 요청'}
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
