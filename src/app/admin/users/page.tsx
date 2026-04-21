import type { Metadata } from 'next';
import { Shield, Store, UserCheck, Users } from 'lucide-react';
import { listUsers } from '@/lib/server/auth-store';

export const metadata: Metadata = { title: 'Users | Admin' };
export const dynamic = 'force-dynamic';

const roleMap = {
  ADMIN: { label: 'Admin', bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  OWNER: { label: 'Owner', bg: 'bg-amber-100', text: 'text-amber-700', icon: Store },
  USER: { label: 'User', bg: 'bg-gray-100', text: 'text-gray-600', icon: UserCheck },
} as const;

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
        <Users className="h-5 w-5 text-red-600" />
        User management
      </h1>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 font-bold">Name</th>
              <th className="px-4 py-2 font-bold">Email</th>
              <th className="px-4 py-2 text-center font-bold">Role</th>
              <th className="px-4 py-2 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {users.map((user) => {
              const role = roleMap[user.role];
              const Icon = role.icon;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-bold text-gray-800">{user.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${role.bg} ${role.text}`}
                    >
                      <Icon className="h-3 w-3" />
                      {role.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{user.status ?? 'approved'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
