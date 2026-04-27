import type { Metadata } from 'next';
import PublicInfoPage from '@/components/PublicInfoPage';
import { getPublicLegalDocument } from '@/lib/server/public-legal-documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublicLegalDocument('terms');
  return {
    title: document.title,
    description: document.description,
  };
}

export default async function TermsPage() {
  const document = await getPublicLegalDocument('terms');

  return (
    <PublicInfoPage
      eyebrow={document.eyebrow}
      title={document.title}
      description={document.description}
      sections={document.sections}
      note={document.note}
    />
  );
}
