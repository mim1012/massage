'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Bell,
  Crown,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Settings,
  Store,
  UserCheck,
  Users,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/approvals', label: '승인 관리', icon: UserCheck },
  { href: '/admin/partnerships', label: '제휴 문의', icon: MessageSquare },
  { href: '/admin/shops', label: '업소 관리', icon: Store },
  { href: '/admin/reviews', label: '리뷰 관리', icon: MessageSquare },
  { href: '/admin/premium', label: '프리미엄', icon: Crown },
  { href: '/admin/notice', label: '공지사항', icon: Bell },
  { href: '/admin/qna', label: 'Q&A', icon: MessageCircle },
  { href: '/admin/stats', label: '통계', icon: BarChart2 },
  { href: '/admin/users', label: '회원 관리', icon: Users },
  { href: '/admin/settings', label: '사이트 설정', icon: Settings },
];

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const result = (await response.json()) as { user: SessionUser };
        setCurrentUser(result.user);
      } catch {
        setCurrentUser(null);
      }
    };

    void loadCurrentUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[200px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
            <span className="text-xs font-black text-white">M</span>
          </div>
          <span className="text-sm font-bold text-gray-800">관리자</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-red-50 font-bold text-red-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-gray-200 p-3">
          <Link href="/" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <Eye className="h-4 w-4" />
            사이트 보기
          </Link>
          <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      <div className="ml-0 flex min-h-screen min-w-0 flex-1 flex-col md:ml-[200px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-bold text-gray-800">관리자 모드</div>
          <div className="ml-auto text-xs text-gray-500">
            {currentUser ? `${currentUser.name} (${currentUser.email})` : '활성 세션 없음'}
          </div>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
