'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Store, UserCheck, Shield } from 'lucide-react';
import type { User } from '@/lib/types';

const roleMap: Record<string, { label: string; bg: string; text: string; icon: typeof Crown }> = {
  ADMIN: { label: '최고관리자', bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  OWNER: { label: '업체관리자', bg: 'bg-amber-100', text: 'text-amber-700', icon: Store },
  USER: { label: '일반회원', bg: 'bg-gray-100', text: 'text-gray-600', icon: UserCheck },
};

const roleEmoji: Record<string, string> = {
  ADMIN: '👑',
  OWNER: '🏢',
  USER: '👤',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(({ users: data }: { users: User[] }) => setUsers(data ?? []));
  }, []);

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-red-600" /> 대상별 회원 관리
      </h1>

      <div className="bg-white border border-gray-200 rounded overflow-hidden table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-responsive">
          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-bold">이름</th>
              <th className="px-4 py-2 font-bold">이메일</th>
              <th className="px-4 py-2 font-bold text-center">권한</th>
              <th className="px-4 py-2 font-bold">상태</th>
              <th className="px-4 py-2 font-bold text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {users.map(user => {
              const r = roleMap[user.role] ?? roleMap['USER'];
              return (
                <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                  <td data-label="이름" className="px-4 py-2.5 font-bold text-gray-800">{user.name}</td>
                  <td data-label="이메일" className="px-4 py-2.5 text-gray-600">{user.email}</td>
                  <td data-label="권한" className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${r.bg} ${r.text}`}>
                      {roleEmoji[user.role] ?? '👤'} {r.label}
                    </span>
                  </td>
                  <td data-label="상태" className="px-4 py-2.5 text-gray-400">
                    {user.status === 'pending' ? '심사중' : user.status === 'rejected' ? '반려' : '정상'}
                  </td>
                  <td data-label="관리" className="px-4 py-2.5 text-center">
                    <button className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] text-gray-600 hover:bg-gray-100">
                      수정
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">회원 정보가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}

// 모바일 대응 커스텀 CSS
const styles = `
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .table td {
    word-break: keep-all;
  }

  @media (max-width: 768px) {
    .table-responsive thead {
      display: none;
    }

    .table-responsive,
    .table-responsive tbody,
    .table-responsive tr,
    .table-responsive td {
      display: block;
      width: 100%;
    }

    .table-responsive tr {
      background: #fff;
      border-radius: 10px;
      margin-bottom: 12px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #f0f0f0;
    }

    .table-responsive td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      font-size: 13px;
      white-space: normal;
      border-bottom: 1px solid #f9fafb;
      text-align: right;
    }

    .table-responsive td:last-child {
      border-bottom: none;
    }

    .table-responsive td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #888;
      width: 80px;
      text-align: left;
      flex-shrink: 0;
    }
  }
`;

// 컴포넌트에 주입
if (typeof document !== 'undefined') {
  const styleId = 'user-admin-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}
