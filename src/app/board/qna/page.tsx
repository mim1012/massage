import QnaPageClient from '@/components/public/QnaPageClient';
import { getSessionUser } from '@/lib/auth/guards';
import { normalizePageParam } from '@/lib/pagination';
import { listPublicQnaPage } from '@/lib/server/communityStore';

export const dynamic = 'force-dynamic';

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
    shopId?: SearchParamValue;
    q?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QnaPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const shopId = pickFirst(resolvedSearchParams?.shopId);
  const search = pickFirst(resolvedSearchParams?.q)?.trim();

  const viewer = await getSessionUser();
  const entryPage = await listPublicQnaPage({
    page,
    shopId,
    search,
    viewer: viewer ? { id: viewer.id, role: viewer.role } : undefined,
  });

  return <QnaPageClient initialEntries={entryPage.items} initialPage={entryPage.page} initialTotalPages={entryPage.totalPages} />;
}
