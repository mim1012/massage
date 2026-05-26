'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function RegisterOwnerSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg border border-gray-100">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-black text-gray-800">입점사 승인 신청 완료!</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          회원 가입 및 입점 승인 신청이 성공적으로 접수되었습니다.
          <br />
          현재 <span className="font-extrabold text-blue-600">관리자 승인 대기 중</span> 상태입니다.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          정상 승인 처리 후 등록하신 메인 계정으로 로그인이 가능합니다.
          <br />
          승인은 신속하게 영업일 기준 1~2일 내에 완료되며,
          <br />
          처리가 끝나는 대로 즉시 문자로 연락을 드립니다.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-sm"
          >
            메인 홈페이지로 돌아가기
          </Link>
          <Link
            href="/auth/login"
            className="w-full rounded-lg border border-gray-300 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            이미 승인되었다면 로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
