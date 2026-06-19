'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';

export default function RegisterOwnerSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Store className="h-8 w-8" />
        </div>
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            입점 신청이 완료되었습니다
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">
            회원 가입 및 입점 승인 신청이 성공적으로 접수되었습니다.
            <br />
            현재{" "}
            <span className="font-bold text-blue-600">관리자 승인 대기 중</span>
            입니다.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            승인 완료 후 등록하신 계정으로 로그인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full rounded-lg bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700"
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
