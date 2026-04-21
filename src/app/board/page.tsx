import type { Metadata } from 'next';
import Link from 'next/link';
import { getBoardSummary } from '@/lib/server/communityStore';

export const metadata: Metadata = {
  title: '\ucee4\ubba4\ub2c8\ud2f0',
  description: '\uacf5\uc9c0\uc0ac\ud56d, \ubb38\uc758\ub2f5\ubcc0, \ud6c4\uae30\ub97c \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
};

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const summary = await getBoardSummary();

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-4">
      <h1 className="mb-4 text-lg font-black text-gray-800">\ucee4\ubba4\ub2c8\ud2f0</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { href: '/board/notice', label: '\uacf5\uc9c0\uc0ac\ud56d', count: summary.notices, badge: 'N' },
          { href: '/board/qna', label: '\ubb38\uc758\ub2f5\ubcc0', count: summary.qna, badge: 'Q' },
          { href: '/board/review', label: '\ud6c4\uae30', count: summary.reviews, badge: 'R' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded border border-gray-200 bg-white p-3 text-center transition-all hover:border-red-300 hover:bg-red-50/50">
            <div className="mb-1 text-2xl font-black text-red-500">{item.badge}</div>
            <p className="text-sm font-bold text-gray-800">{item.label}</p>
            <p className="text-xs text-gray-400">{item.count}\uac74</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
