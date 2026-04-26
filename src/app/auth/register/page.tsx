import Link from 'next/link';
import { Store, User } from 'lucide-react';

export default function RegisterSelectionPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-2xl font-black text-gray-800 md:text-3xl">
            어떤 회원으로 가입하시겠어요?
          </h1>
          <p className="text-sm text-gray-500 md:text-base">
            목적에 맞는 회원가입 유형을 선택해 주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            href="/auth/register/user"
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-transparent bg-white p-8 text-center shadow-sm transition-all hover:border-red-500 hover:shadow-md"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-red-50">
              <User className="h-10 w-10 text-gray-400 transition-colors group-hover:text-red-500" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">일반 고객 회원</h2>
              <p className="text-sm text-gray-500">
                힐링찾기를 통해 나와 맞는 테라피를
                <br />
                찾고 이용하고 싶으신 분
              </p>
            </div>
            <div className="mt-4 rounded-full bg-gray-100 px-6 py-2 text-sm font-bold text-gray-700 transition-colors group-hover:bg-red-600 group-hover:text-white">
              일반 가입하기
            </div>
          </Link>

          <Link
            href="/auth/register-owner"
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-transparent bg-white p-8 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-blue-50">
              <Store className="h-10 w-10 text-gray-400 transition-colors group-hover:text-blue-500" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">입점사 (사장님)</h2>
              <p className="text-sm text-gray-500">
                운영 중인 내 업소를 등록하고
                <br />
                더 많은 고객과 만나고 싶으신 분
              </p>
            </div>
            <div className="mt-4 rounded-full bg-gray-100 px-6 py-2 text-sm font-bold text-gray-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              입점 신청하기
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-sm">
          <span className="text-gray-400">이미 계정이 있으신가요? </span>
          <Link href="/auth/login" className="font-semibold text-red-600 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
