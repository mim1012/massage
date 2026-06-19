'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Store, Bell, MessageCircle, Settings,
  LogOut, Crown, BarChart2, Users, Eye, Menu, X, ChevronRight, UserCheck, MessageSquare, ClipboardList
} from 'lucide-react';
import { UserRole, User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mockData';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // localStorage auth_user 기반으로 초기 user 설정
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        const defaultUser = MOCK_USERS[0];
        localStorage.setItem('auth_user', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
      }
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } finally {
      localStorage.removeItem('auth_user');
      router.replace('/auth/login');
      router.refresh();
    }
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
    { href: '/admin/settings', label: '사이트 설정', icon: Settings, roles: ['ADMIN'] },
  ];

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));

  if (!isClient) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full w-[200px] bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#D4A373] flex items-center justify-center">
            <span className="text-white font-black text-xs">힐</span>
          </div>
          <span className="font-bold text-gray-800 text-sm">힐링 관리자</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm mb-1 transition-colors ${
                  isActive ? 'bg-[#FEFAE0] text-[#D4A373] font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <button 
            onClick={() => {
              const nextRole = currentUser.role === 'ADMIN' ? 'OWNER' : 'ADMIN';
              const nextUser = nextRole === 'ADMIN' ? MOCK_USERS[0] : MOCK_USERS[1];
              localStorage.setItem('auth_user', JSON.stringify(nextUser));
              setCurrentUser(nextUser);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-[#8B9A67] hover:bg-[#7A8956] rounded mb-2 transition-colors">
            <UserCheck className="w-4 h-4" /> [테스트용] {currentUser.role === 'ADMIN' ? 'OWNER 접속' : 'ADMIN 접속'}
          </button>
          <a href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Eye className="w-4 h-4" /> 사이트 보기
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-[#FEFAE0] hover:text-[#D4A373] rounded"
          >
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 md:ml-[200px] flex flex-col min-h-screen min-w-0">
        <header className="bg-white border-b border-gray-200 h-14 px-4 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-gray-800">{currentUser.role === 'ADMIN' ? '어드민 모드' : '내 업소 관리 모드'}</div>
          <div className="ml-auto text-xs text-gray-500">{currentUser.name} ({currentUser.email || currentUser.id})</div>
        </header>
        <main className="flex-1 p-4 flex flex-col">
          {currentUser.role === 'OWNER' && currentUser.status === 'pending' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">입점 승인 대기 중입니다</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                관리자가 업체 등록 정보를 확인한 후 가입을 승인합니다.<br/>
                승인 완료 후 정상적으로 업소 관리 기능을 이용하실 수 있습니다.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
