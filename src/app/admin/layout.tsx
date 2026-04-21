import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';
import { getSessionUser } from '@/lib/auth/guards';
import AdminShell from './admin-shell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLayoutUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getSessionUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const adminUser: AdminLayoutUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };

  return <AdminShell currentUser={adminUser}>{children}</AdminShell>;
}
