'use client';

import { useEffect, useState } from 'react';
import { Building, Check, Mail, Phone, UserCheck, X } from 'lucide-react';
import clsx from 'clsx';
import type { User } from '@/lib/types';

type ApprovalResponse = {
  pendingUsers?: User[];
  processedUsers?: User[];
  error?: string;
};

export default function ApprovalsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingUsers = users.filter((user) => user.status === 'pending');
  const processedUsers = users.filter((user) => user.status !== 'pending');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/admin/approvals');
      const result = (await response.json()) as ApprovalResponse;

      if (!response.ok) {
        setError(result.error ?? 'Failed to load approvals.');
        setLoading(false);
        return;
      }

      setUsers([...(result.pendingUsers ?? []), ...(result.processedUsers ?? [])]);
      setError(null);
      setLoading(false);
    };

    void load();
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    const response = await fetch(`/api/admin/approvals/${id}/${action}`, {
      method: 'PATCH',
    });
    const result = (await response.json()) as { user?: User; error?: string };

    if (!response.ok || !result.user) {
      setError(result.error ?? 'Failed to update status.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === id ? result.user! : user)));
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-red-600" />
          Owner approvals
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
          Pending requests ({pendingUsers.length})
        </h2>
        {loading && <div className="text-sm text-gray-500 mb-4">Loading approvals...</div>}
        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending owner requests.</div>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="border border-blue-100 bg-blue-50/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{user.businessName}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                      Pending
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      {user.businessNumber}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      {user.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {user.phone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void updateStatus(user.id, 'approve')}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => void updateStatus(user.id, 'reject')}
                    className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold text-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Processed requests</h2>
        {processedUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No processed requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-bold text-center">Status</th>
                  <th className="px-4 py-2 font-bold">Business</th>
                  <th className="px-4 py-2 font-bold">Email</th>
                  <th className="px-4 py-2 font-bold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs rounded-full font-bold',
                          user.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                        )}
                      >
                        {user.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{user.businessName}</td>
                    <td className="px-4 py-2 text-gray-500">{user.email}</td>
                    <td className="px-4 py-2 text-gray-500">{user.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
