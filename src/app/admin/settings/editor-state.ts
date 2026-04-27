import { DEFAULT_LEGAL_DOCUMENTS, type EditableLegalDocument, type LegalDocumentSlug } from '@/lib/legal-documents';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';

export type AdminLegalDocumentState = EditableLegalDocument & {
  updatedAt?: string | null;
};

export type AdminSettingsBaseline = {
  siteForm: SiteSettings;
  seoForm: HomeSeoContent;
  legalDocs: Record<LegalDocumentSlug, AdminLegalDocumentState>;
};

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function toEditableLegalDocument(document: AdminLegalDocumentState | EditableLegalDocument) {
  return {
    eyebrow: document.eyebrow,
    title: document.title,
    description: document.description,
    note: document.note,
    body: document.body,
  } satisfies EditableLegalDocument;
}

export function createDefaultAdminSettingsState(input: {
  siteSettings: SiteSettings;
  homeSeo: HomeSeoContent;
  legalDocs: Record<LegalDocumentSlug, EditableLegalDocument | AdminLegalDocumentState>;
}): AdminSettingsBaseline {
  return {
    siteForm: { ...input.siteSettings },
    seoForm: { ...input.homeSeo },
    legalDocs: {
      privacy: { ...input.legalDocs.privacy },
      terms: { ...input.legalDocs.terms },
      youth: { ...input.legalDocs.youth },
      ad: { ...input.legalDocs.ad },
      mobile: { ...input.legalDocs.mobile },
    },
  };
}

export function getAdminSettingsDirtyState(input: {
  baseline: AdminSettingsBaseline | null;
  siteForm: SiteSettings;
  seoForm: HomeSeoContent;
  legalDocs: Record<LegalDocumentSlug, AdminLegalDocumentState>;
}) {
  if (!input.baseline) {
    return {
      hasSiteChanges: false,
      hasSeoChanges: false,
      hasAnyChanges: false,
      legalDocs: {
        privacy: false,
        terms: false,
        youth: false,
        ad: false,
        mobile: false,
      } as Record<LegalDocumentSlug, boolean>,
    };
  }

  const hasSiteChanges = stableStringify(input.baseline.siteForm) !== stableStringify(input.siteForm);
  const hasSeoChanges = stableStringify(input.baseline.seoForm) !== stableStringify(input.seoForm);
  const legalDocs = {
    privacy: stableStringify(toEditableLegalDocument(input.baseline.legalDocs.privacy)) !== stableStringify(toEditableLegalDocument(input.legalDocs.privacy)),
    terms: stableStringify(toEditableLegalDocument(input.baseline.legalDocs.terms)) !== stableStringify(toEditableLegalDocument(input.legalDocs.terms)),
    youth: stableStringify(toEditableLegalDocument(input.baseline.legalDocs.youth)) !== stableStringify(toEditableLegalDocument(input.legalDocs.youth)),
    ad: stableStringify(toEditableLegalDocument(input.baseline.legalDocs.ad)) !== stableStringify(toEditableLegalDocument(input.legalDocs.ad)),
    mobile: stableStringify(toEditableLegalDocument(input.baseline.legalDocs.mobile)) !== stableStringify(toEditableLegalDocument(input.legalDocs.mobile)),
  } satisfies Record<LegalDocumentSlug, boolean>;

  return {
    hasSiteChanges,
    hasSeoChanges,
    legalDocs,
    hasAnyChanges: hasSiteChanges || hasSeoChanges || Object.values(legalDocs).some(Boolean),
  };
}

export function resetLegalDocumentToDefault(
  slug: LegalDocumentSlug,
  current: AdminLegalDocumentState,
): AdminLegalDocumentState {
  return {
    ...DEFAULT_LEGAL_DOCUMENTS[slug],
    updatedAt: current.updatedAt ?? null,
  };
}
