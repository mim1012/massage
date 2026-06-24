import { Metadata } from 'next';
import AdminStatsPageClient from '@/components/admin/AdminStatsPageClient';
import { getCachedAdminStatsData } from '@/lib/server/admin-stats';

export const metadata: Metadata = { title: '통계 | 관리자' };

export default async function AdminStatsPage() {
  const initialStats = await getCachedAdminStatsData();

  return <AdminStatsPageClient initialStats={initialStats} />;
}
