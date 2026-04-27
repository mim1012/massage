import { redirect } from 'next/navigation';
import ReviewManagementPage from '@/components/admin/ReviewManagementPage';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedReviews } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function OwnerReviewsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/');
  }

  return <ReviewManagementPage scope="owner" initialReviews={await listManagedReviews(user)} />;
}
