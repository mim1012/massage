'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, Bell, MessageCircle, Settings,
  LogOut, Crown, BarChart2, Users, Eye, Menu, UserCheck, MessageSquare, ClipboardList, Tag
} from 'lucide-react';
import type { User } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: { user: User | null }) => {
        if (!data.user || (data.user.role !== 'ADMIN' && data.user.role !== 'OWNER')) {
          router.replace('/auth/login');
          return;
        }
        setCurrentUser(data.user);
      })
      .catch(() => router.replace('/auth/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/auth/login');
  };

  const ALL_NAV_ITEMS = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard, roles: ['ADMIN'] },
    { href: '/admin/approvals', label: '입점 승인 관리', icon: UserCheck, roles: ['ADMIN'] },
    { href: '/admin/partnerships', label: '입점 문의 관리', icon: ClipboardList, roles: ['ADMIN'] },
    { href: '/admin/shops', label: '업소 관리', icon: Store, roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/reviews', label: '후기 관리', icon: MessageSquare, roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/premium', label: '프리미엄 배너', icon: Crown, roles: ['ADMIN'] },
    { href: '/admin/notice', label: '공지 관리', icon: Bell, roles: ['ADMIN'] },
    { href: '/admin/qna', label: 'Q&A 관리', icon: MessageCircle, roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/stats', label: '통계', icon: BarChart2, roles: ['ADMIN'] },
    { href: '/admin/users', label: '회원 관리', icon: Users, roles: ['ADMIN'] },
    { href: '/admin/themes', label: '테마 관리', icon: Tag, roles: ['ADMIN'] },
    { href: '/admin/settings', label: '사이트 설정', icon: Settings, roles: ['ADMIN'] },
  ];

  const NAV_ITEMS = currentUser
    ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role))
    : [];

  if (!currentUser) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">인증 확인 중...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[200px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#D4A373]">
            <span className="text-xs font-black text-white">힐</span>
          </div>
          <span className="text-sm font-bold text-gray-800">힐링 관리자</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-[#FEFAE0] font-bold text-[#D4A373]' : 'text-gray-600 hover:bg-gray-100'
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
            <Eye className="h-4 w-4" /> 사이트 보기
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-600 hover:bg-[#FEFAE0] hover:text-[#D4A373]"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[200px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-bold text-gray-800">
            {currentUser.role === 'ADMIN' ? '어드민 모드' : '내 업소 관리 모드'}
          </div>
          <div className="ml-auto text-xs text-gray-500">
            {currentUser.name} ({currentUser.email})
          </div>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
