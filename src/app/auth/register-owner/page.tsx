'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, UserCircle, Briefcase, Phone, Mail, Lock } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    // TODO: 실제 가입 API 호출
    console.log('가입 신청 데이터:', formData);

    // 자동 로그인 처리 (localStorage 세션 저장)
    localStorage.setItem('auth_user', JSON.stringify({
      id: formData.id,
      name: formData.name,
      role: 'OWNER',
      businessName: formData.businessName,
      status: 'pending',
    }));

    setIsSubmitted(true);

    // 업체등록(업소관리) 페이지로 자동 이동
    setTimeout(() => {
      router.push('/admin/shops');
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">입점 신청이 완료되었습니다</h2>
            <p className="text-gray-600">
              업체등록 페이지로 이동합니다...<br />
              <span className="text-sm text-gray-400">(자동 이동 중)</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/shops')}
            className="inline-block w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            업체등록 바로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-4">
            <span className="text-white font-black text-xl">힐</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">입점사 회원가입</h1>
          <p className="text-sm text-gray-500 mt-2">간단한 정보 입력 후 힐링 디렉토리에 입점하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="id" required value={formData.id} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="아이디 입력" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" name="password" required value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" name="passwordConfirm" required value={formData.passwordConfirm} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="name" required value={formData.name} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="홍길동" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업체명</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="강남 힐링스파" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업자 등록번호</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="businessNumber" required value={formData.businessNumber} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="123-45-67890" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 연락처</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 outline-none"
                placeholder="010-1234-5678" />
            </div>
          </div>

          <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg mt-6 hover:bg-red-700 transition-colors">
            회원가입 후 업체등록 진행
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요? <Link href="/auth/login" className="text-red-600 font-medium hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  );
}
