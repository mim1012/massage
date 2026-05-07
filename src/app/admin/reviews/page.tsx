import { redirect } from 'next/navigation';
import ReviewManagementPage from '@/components/admin/ReviewManagementPage';
import { getSessionUser } from '@/lib/auth/guards';
import { listManagedReviews } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  return <ReviewManagementPage scope="admin" initialReviews={await listManagedReviews(user)} initialDataLoaded />;
}
