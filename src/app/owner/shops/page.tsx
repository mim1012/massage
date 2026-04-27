import { redirect } from 'next/navigation';
import OwnerShopsPageClient from '@/components/owner/OwnerShopsPageClient';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedShops } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function OwnerShopsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/');
  }

  return <OwnerShopsPageClient initialShops={await listManagedShops(user)} />;
}
