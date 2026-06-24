import { redirect } from 'next/navigation';
import AdminShopsPageClient from '@/components/admin/AdminShopsPageClient';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedShopsPage } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function AdminShopsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role === 'OWNER') {
    redirect('/owner/shops');
  }

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  return <AdminShopsPageClient initialData={await listManagedShopsPage(user, { page: 1, pageSize: 20 })} />;
}
