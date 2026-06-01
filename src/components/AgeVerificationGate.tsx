'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ADULT_CONFIRM_KEY = 'massage-adult-confirmed';

export default function AgeVerificationGate() {
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setConfirmed(window.localStorage.getItem(ADULT_CONFIRM_KEY) === 'true');
      } catch {
        setConfirmed(false);
      }

      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || confirmed) {
      return;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [ready, confirmed]);

  if (!ready || confirmed) {
    return null;
  }

  const handleConfirm = () => {
    try {
      window.localStorage.setItem(ADULT_CONFIRM_KEY, 'true');
    } catch {
      // Ignore storage failures and still unblock the current session.
    }

    setConfirmed(true);
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-600">19세 이상 이용</div>
        <h2 className="text-2xl font-black text-gray-900">성인 확인이 필요합니다.</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          본 서비스에는 청소년에게 부적절할 수 있는 업소·후기 정보가 포함될 수 있습니다. 만 19세 이상 이용자만
          계속 진행해 주세요.
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          계속 진행하면 본인이 만 19세 이상이며 관련 안내를 확인했다는 점에 동의한 것으로 간주합니다.
        </div>
        <div className="mt-4 text-xs text-gray-500">
          자세한 운영 기준은{' '}
          <Link href="/youth" className="font-bold text-red-600 underline underline-offset-2">
            청소년보호정책
          </Link>
          에서 확인할 수 있습니다.
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExit}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            19세 미만 / 나가기
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-700"
          >
            19세 이상입니다
          </button>
        </div>
      </div>
    </div>
  );
}