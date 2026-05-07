import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/guards';
import { getRoleHomeHref } from '@/lib/auth/navigation';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/my');
  }

  if (user.role !== 'USER') {
    redirect(getRoleHomeHref(user.role));
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">My</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">내 정보</h1>
        <p className="mt-1 text-sm text-gray-500">로그인 상태와 커뮤니티 이용 메뉴를 확인할 수 있습니다.</p>

        <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
          <p><span className="font-semibold text-gray-900">이름</span> · {user.name}</p>
          <p className="mt-1"><span className="font-semibold text-gray-900">아이디</span> · {user.email}</p>
          <p className="mt-1"><span className="font-semibold text-gray-900">권한</span> · 일반 회원</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/board/review" className="rounded-lg border border-gray-200 bg-white px-4 py-4 transition hover:border-red-300 hover:bg-red-50/40">
            <p className="text-sm font-bold text-gray-900">후기 보기</p>
            <p className="mt-1 text-xs text-gray-500">로그인 회원 전용 후기 목록으로 이동합니다.</p>
          </Link>
          <Link href="/board/qna" className="rounded-lg border border-gray-200 bg-white px-4 py-4 transition hover:border-red-300 hover:bg-red-50/40">
            <p className="text-sm font-bold text-gray-900">Q&A 이용</p>
            <p className="mt-1 text-xs text-gray-500">질문 작성과 답변 확인 페이지로 이동합니다.</p>
          </Link>
          <Link href="/board" className="rounded-lg border border-gray-200 bg-white px-4 py-4 transition hover:border-red-300 hover:bg-red-50/40">
            <p className="text-sm font-bold text-gray-900">커뮤니티</p>
            <p className="mt-1 text-xs text-gray-500">공지, Q&A, 후기 메인으로 이동합니다.</p>
          </Link>
          <Link href="/" className="rounded-lg border border-gray-200 bg-white px-4 py-4 transition hover:border-red-300 hover:bg-red-50/40">
            <p className="text-sm font-bold text-gray-900">홈으로</p>
            <p className="mt-1 text-xs text-gray-500">메인 홈으로 돌아갑니다.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
