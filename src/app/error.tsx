'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  const isDatabaseError = error.message === 'DATABASE_ERROR';

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-bold text-[var(--portal-brand)]">페이지를 불러오지 못했습니다</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">
          {isDatabaseError ? '서버 통신이 잠시 불안정합니다.' : '일시적인 서버 오류가 발생했습니다.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          {isDatabaseError
            ? '데이터베이스 연결이 잠깐 흔들렸습니다. 몇 초 후 다시 시도하면 대부분 바로 복구됩니다.'
            : '페이지 처리 중 예기치 않은 오류가 발생했습니다. 다시 시도하거나 홈으로 이동해 주세요.'}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[var(--portal-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--portal-brand-hover)]"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
