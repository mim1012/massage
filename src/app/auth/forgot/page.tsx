import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[70vh] bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-red-600 text-lg font-black text-white">
            힐
          </div>
          <h1 className="text-lg font-black text-gray-800">비밀번호 찾기</h1>
          <p className="mt-2 text-sm text-gray-500">
            현재 비밀번호 재설정은 관리자 확인 후 도와드리고 있습니다.
          </p>
        </div>

        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-red-600">안내</p>
          <p className="mt-2">가입하신 아이디와 함께 관리자 또는 고객센터로 문의해 주세요.</p>
          <p className="mt-1">대표 문의: 1588-0000</p>
        </div>

        <div className="mt-6 flex gap-2">
          <Link
            href="/auth/login"
            prefetch={false}
            className="flex-1 rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            로그인으로 돌아가기
          </Link>
          <Link
            href="/board/qna"
            prefetch={false}
            className="flex-1 rounded bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            고객센터 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
