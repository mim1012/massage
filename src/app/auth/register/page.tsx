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

        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <Link
            href="/auth/register/user"
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-red-500 hover:shadow-md md:gap-4 md:p-8"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-red-50 md:h-20 md:w-20">
              <User className="h-7 w-7 text-gray-400 transition-colors group-hover:text-red-500 md:h-10 md:w-10" />
            </div>
            <div>
              <h2 className="mb-1 text-base font-bold text-gray-800 md:mb-2 md:text-xl">일반 고객 회원</h2>
              <p className="text-[11px] text-gray-500 md:text-sm">
                힐링찾기를 통해 나와 맞는 테라피를
                <br className="hidden md:block" />
                찾고 이용하고 싶으신 분
              </p>
            </div>
            <div className="mt-2 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-700 transition-colors group-hover:bg-red-600 group-hover:text-white md:mt-4 md:px-6 md:py-2 md:text-sm">
              일반 가입하기
            </div>
          </Link>

          <Link
            href="/auth/register-owner"
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md md:gap-4 md:p-8"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-blue-50 md:h-20 md:w-20">
              <Store className="h-7 w-7 text-gray-400 transition-colors group-hover:text-blue-500 md:h-10 md:w-10" />
            </div>
            <div>
              <h2 className="mb-1 text-base font-bold text-gray-800 md:mb-2 md:text-xl">입점사 (사장님)</h2>
              <p className="text-[11px] text-gray-500 md:text-sm">
                운영 중인 내 업소를 등록하고
                <br className="hidden md:block" />
                더 많은 고객과 만나고 싶으신 분
              </p>
            </div>
            <div className="mt-2 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-700 transition-colors group-hover:bg-blue-600 group-hover:text-white md:mt-4 md:px-6 md:py-2 md:text-sm">
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
