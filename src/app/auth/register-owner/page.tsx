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
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? '업주 회원 가입 요청에 실패했습니다.');
      return;
    }

    setIsSubmitted(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">업주 가입 요청이 접수되었습니다</h2>
            <p className="text-gray-600">
              현재 관리자 승인 대기 상태입니다. 승인되면 로그인 후 업소 정보를 관리할 수 있습니다.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-4"
          >
            <span className="text-white font-black text-xl">M</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">업주 회원 가입</h1>
          <p className="text-sm text-gray-500 mt-2">
            업주 계정을 생성하고 관리자 승인을 기다려 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="owner@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                  placeholder="비밀번호"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="passwordConfirm"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                  placeholder="비밀번호 확인"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="담당자 이름"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업소명</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="예: 힐링 스파"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="businessNumber"
                required
                value={formData.businessNumber}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="123-45-67890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg mt-6 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? '제출 중...' : '업주 계정 승인 요청'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?
          {' '}
          <Link href="/auth/login" className="text-red-600 font-medium hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
