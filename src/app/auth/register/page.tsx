import Link from 'next/link';
import { User, Store } from 'lucide-react';

export default function RegisterSelectionPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">어떤 회원으로 가입하시겠어요?</h1>
          <p className="text-gray-500 text-sm md:text-base">목적에 맞는 회원가입 유형을 선택해 주세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 일반 사용자 */}
          <Link href="/auth/register/user" 
            className="group bg-white border-2 border-transparent hover:border-red-500 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 group-hover:bg-red-50 rounded-full flex items-center justify-center transition-colors">
              <User className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">일반 고객 회원</h2>
              <p className="text-sm text-gray-500">
                힐링찾기를 통해 나와 맞는 테라피를<br/>
                찾고 이용하고 싶으신 분
              </p>
            </div>
            <div className="mt-4 px-6 py-2 bg-gray-100 group-hover:bg-red-600 group-hover:text-white rounded-full font-bold text-sm text-gray-700 transition-colors">
              일반 가입하기
            </div>
          </Link>

          {/* 입점사 (사장님) */}
          <Link href="/auth/register-owner" 
            className="group bg-white border-2 border-transparent hover:border-blue-500 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors">
              <Store className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">입점사 (사장님)</h2>
              <p className="text-sm text-gray-500">
                운영 중인 내 업소를 등록하고<br/>
                더 많은 고객과 만나고 싶으신 분
              </p>
            </div>
            <div className="mt-4 px-6 py-2 bg-gray-100 group-hover:bg-blue-600 group-hover:text-white rounded-full font-bold text-sm text-gray-700 transition-colors">
              입점 신청하기
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-sm">
          <span className="text-gray-400">이미 계정이 있으신가요? </span>
          <Link href="/auth/login" className="text-red-600 font-semibold hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  );
}
