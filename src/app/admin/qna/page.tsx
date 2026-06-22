import { redirect } from 'next/navigation';
import QnaManagementPage from '@/components/admin/QnaManagementPage';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedShops, listQna } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function AdminQnaPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'ADMIN') {
    redirect(user.role === 'OWNER' ? '/owner/qna' : '/');
  }

  const [initialShops, initialQnaList] = await Promise.all([
    listManagedShops(user),
    listQna({ viewer: user }),
  ]);

  return <QnaManagementPage scope="admin" initialQnaList={initialQnaList} initialShops={initialShops} initialDataLoaded />;
}