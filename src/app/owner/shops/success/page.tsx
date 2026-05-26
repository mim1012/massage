'use client';

import Link from 'next/link';

export default function ShopSubmitSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-xl border border-gray-100">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
          🏢
        </div>
        <h1 className="text-3xl font-black text-gray-800">업체 등록 신청 완료!</h1>
        <p className="mt-5 text-base leading-relaxed text-gray-600">
          점포 등록 신청이 성공적으로 접수되었습니다.
          <br />
          <span className="font-bold text-blue-600">관리자의 서류 검토 및 승인 완료 후</span>
          <br />
          메인 페이지 및 목록에 정식으로 노출이 시작됩니다.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          승인은 접수 후 보통 1~2시간 내에 신속하게 처리되며,
          <br />
          승인이 완료되면 기재하신 번호로 즉시 알림이 발송됩니다.
        </p>
        
        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/owner/shops"
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-md"
          >
            내 업체 관리 목록으로 이동
          </Link>
          <Link
            href="/"
            className="w-full rounded-xl border border-gray-300 py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
          >
            메인 홈페이지 바로가기
          </Link>
        </div>
      </div>
    </div>
  );
}
