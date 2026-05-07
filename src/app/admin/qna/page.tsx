import { redirect } from 'next/navigation';
import QnaManagementPage from '@/components/admin/QnaManagementPage';
import { getSessionUser } from '@/lib/auth/guards';
import { listQna } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function AdminQnaPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  return <QnaManagementPage scope="admin" initialQnaList={await listQna({ viewer: user })} initialDataLoaded />;
}
