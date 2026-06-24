import { redirect } from 'next/navigation';
import QnaManagementPage from '@/components/admin/QnaManagementPage';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedShopOptions, listQna } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function OwnerQnaPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/');
  }

  const [initialShops, initialQnaList] = await Promise.all([
    listManagedShopOptions(user),
    listQna({ shopOwnerId: user.role === 'OWNER' ? user.id : undefined, viewer: user }),
  ]);

  const ownedShopIds = new Set(initialShops.map((shop) => shop.id));
  const scopedQna = user.role === 'OWNER'
    ? initialQnaList.filter((entry) => Boolean(entry.shopId && ownedShopIds.has(entry.shopId)))
    : initialQnaList;

  return <QnaManagementPage scope="owner" initialQnaList={scopedQna} initialShops={initialShops} initialDataLoaded />;
}
