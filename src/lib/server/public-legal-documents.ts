import { getLegalDocument } from '@/lib/server/legal-documents';
import type { LegalDocumentSlug, ResolvedLegalDocument } from '@/lib/legal-documents';

type LegalDocumentLoader = (slug: LegalDocumentSlug) => Promise<ResolvedLegalDocument>;

type CachedLegalDocumentGetter = LegalDocumentLoader & {
  clear: (slug?: LegalDocumentSlug) => void;
};

export function createCachedLegalDocumentGetter(loadDocument: LegalDocumentLoader): CachedLegalDocumentGetter {
  const cache = new Map<LegalDocumentSlug, Promise<ResolvedLegalDocument>>();

  const load = (async (slug: LegalDocumentSlug) => {
    const cached = cache.get(slug);
    if (cached) {
      return cached;
    }

    const pending = loadDocument(slug).catch((error) => {
      cache.delete(slug);
      throw error;
    });
    cache.set(slug, pending);
    return pending;
  }) as CachedLegalDocumentGetter;

  load.clear = (slug) => {
    if (slug) {
      cache.delete(slug);
      return;
    }

    cache.clear();
  };

  return load;
}

export const getPublicLegalDocument = createCachedLegalDocumentGetter(getLegalDocument);

export function invalidatePublicLegalDocument(slug?: LegalDocumentSlug) {
  getPublicLegalDocument.clear(slug);
}
