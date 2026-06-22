import { Suspense } from 'react';
import QnaPageClient from '@/components/public/QnaPageClient';
import { listPublicQnaPage } from '@/lib/server/communityStore';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { normalizePageParam } from '@/lib/pagination';

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

export default async function QnAPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const shopId = pickFirst(resolvedSearchParams?.shopId);
  const search = pickFirst(resolvedSearchParams?.q);
  const viewer = await getOptionalSessionUser();
  const entryPage = await listPublicQnaPage({
    page,
    shopId,
    search,
    viewer: viewer ? { id: viewer.id, role: viewer.role } : undefined,
  });

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QnaPageClient
        initialEntries={entryPage.items}
        initialPage={entryPage.page}
        initialTotalPages={entryPage.totalPages}
      />
    </Suspense>
  );
}
