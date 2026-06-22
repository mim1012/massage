import { redirect } from 'next/navigation';
import AdminShell from './admin-shell';
import { getSessionUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/auth/login?next=/admin');
  }

  if (currentUser.role === 'OWNER') {
    redirect('/owner/shops');
  }

  if (currentUser.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <AdminShell
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: 'ADMIN',
      }}
    >
      {children}
    </AdminShell>
  );
}
