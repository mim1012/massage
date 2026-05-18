import type { Metadata } from 'next';
import AdvertisingPageClient from '@/components/public/AdvertisingPageClient';
import { getPublicLegalDocument } from '@/lib/server/public-legal-documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublicLegalDocument('ad');
  return {
    title: document.title,
    description: document.description,
  };
}

export default async function AdPage() {
  const document = await getPublicLegalDocument('ad');

  return (
    <AdvertisingPageClient document={document} />
  );
}
