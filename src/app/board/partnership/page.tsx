import type { Metadata } from 'next';
import PartnershipPageClient from '@/components/public/PartnershipPageClient';
import { resolvePartnershipContactDetails } from '@/lib/legal-documents';
import { getPublicLegalDocument } from '@/lib/server/public-legal-documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublicLegalDocument('partnership');
  return {
    title: document.title,
    description: document.description,
  };
}

export default async function PartnershipPage() {
  const document = await getPublicLegalDocument('partnership');
  const contact = resolvePartnershipContactDetails(document);

  return (
    <PartnershipPageClient
      initialInquiryDoc={{
        eyebrow: document.eyebrow,
        title: document.title,
        description: document.description,
        note: document.note,
        phone: contact.phone,
        kakao: contact.kakao,
      }}
    />
  );
}
