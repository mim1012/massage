import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/guards';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/auth/login');
  }

  if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Owner</p>
          <h1 className="text-lg font-black text-gray-900">업체 관리</h1>
          <p className="text-xs text-gray-500">내 업소 정보와 노출 상태를 이곳에서 확인할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/owner/shops" className="rounded border border-gray-300 px-3 py-2 font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
            내 업소
          </Link>
          <Link href="/owner/reviews" className="rounded border border-gray-300 px-3 py-2 font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
            리뷰 관리
          </Link>
          <Link href="/owner/qna" className="rounded border border-gray-300 px-3 py-2 font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
            Q&A 관리
          </Link>
          <Link href="/" className="rounded border border-gray-300 px-3 py-2 font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
            홈으로
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
