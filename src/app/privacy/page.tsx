import type { Metadata } from 'next';
import PublicInfoPage from '@/components/PublicInfoPage';
import { getLegalDocument } from '@/lib/server/legal-documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocument('privacy');
  return {
    title: document.title,
    description: document.description,
  };
}

export default async function PrivacyPage() {
  const document = await getLegalDocument('privacy');

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
