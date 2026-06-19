'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const COOKIE_NAME = 'massage_adult_verified';

export default function AdultVerificationBarrier() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isVerified = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split('=')[1];

    if (isVerified !== 'true' || process.env.NODE_ENV === 'development') {
      queueMicrotask(() => setShowModal(true));
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleVerify = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    document.cookie = `${COOKIE_NAME}=true; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;

    setShowModal(false);
    document.body.style.overflow = 'unset';
  };

  const handleReject = () => {
    alert('만 19세 미만 청소년은 본 서비스를 이용하실 수 없습니다.\n메인 페이지로 이동합니다.');
    document.body.style.overflow = 'unset';
    router.replace('/');
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl transition-all duration-500" />

      <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md transition-all duration-300">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-red-500/80 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <span className="text-3xl font-black tracking-tighter text-red-500">19</span>
        </div>

        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> 청소년 보호법에 따른 경고
          </span>

          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            성인 전용 서비스 안내
          </h2>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs leading-relaxed text-gray-300">
            본 정보는 청소년유해매체물로서 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 청소년보호법의 규정에 의하여 <strong className="font-extrabold text-red-400">만 19세 미만의 청소년</strong>은 이용하실 수 없습니다.
          </div>

          <p className="text-sm font-semibold text-gray-400">
            귀하는 만 19세 이상의 성인이십니까?
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={handleVerify}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              네, 성인입니다
            </button>

            <button
              onClick={handleReject}
              className="rounded-2xl border border-white/5 bg-white/10 py-3.5 text-sm font-bold text-gray-300 transition-all hover:bg-white/15 hover:text-white active:scale-[0.98]"
            >
              아니오, 나갑니다
            </button>
          </div>

          <p className="mt-4 text-[10px] text-gray-500">
            * 인증 정보는 브라우저 쿠키에 안전하게 7일간 임시 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
