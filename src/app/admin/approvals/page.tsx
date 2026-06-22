import ApprovalsPageClient from '@/components/admin/ApprovalsPageClient';
import { requireRole } from '@/lib/auth/guards';
import { listOwnerApprovals } from '@/lib/server/auth-store';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  await requireRole('ADMIN');
  const initialData = await listOwnerApprovals();

  return <ApprovalsPageClient initialData={initialData} />;
}
