import { getPgPool } from '@/lib/db/prisma';
import {
  DEFAULT_LEGAL_DOCUMENTS,
  resolveLegalDocument,
  type EditableLegalDocument,
  type LegalDocumentSlug,
  type ResolvedLegalDocument,
} from '@/lib/legal-documents';

const TABLE_NAME = 'legal_documents';

async function ensureLegalDocumentsTable() {
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      slug TEXT PRIMARY KEY,
      eyebrow TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      note TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

type LegalDocumentRow = {
  slug: LegalDocumentSlug;
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  body: string;
};

function normalizeEditableLegalDocument(input: EditableLegalDocument) {
  return {
    eyebrow: input.eyebrow.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    note: input.note.trim(),
    body: input.body.trim(),
  };
}

export async function getLegalDocument(slug: LegalDocumentSlug): Promise<ResolvedLegalDocument> {
  try {
    await ensureLegalDocumentsTable();
    const result = await getPgPool().query<LegalDocumentRow>(
      `SELECT slug, eyebrow, title, description, note, body FROM ${TABLE_NAME} WHERE slug = $1 LIMIT 1`,
      [slug],
    );

    return resolveLegalDocument(slug, result.rows[0] ?? null);
  } catch {
    return resolveLegalDocument(slug);
  }
}

export async function getAllLegalDocuments(): Promise<Record<LegalDocumentSlug, ResolvedLegalDocument>> {
  const [privacy, terms, youth] = await Promise.all([
    getLegalDocument('privacy'),
    getLegalDocument('terms'),
    getLegalDocument('youth'),
  ]);
  return { privacy, terms, youth };
}

export async function upsertLegalDocument(slug: LegalDocumentSlug, input: EditableLegalDocument): Promise<ResolvedLegalDocument> {
  await ensureLegalDocumentsTable();
  const normalized = normalizeEditableLegalDocument(input);

  const result = await getPgPool().query<LegalDocumentRow>(
    `
      INSERT INTO ${TABLE_NAME} (slug, eyebrow, title, description, note, body)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug)
      DO UPDATE SET
        eyebrow = EXCLUDED.eyebrow,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        note = EXCLUDED.note,
        body = EXCLUDED.body,
        updated_at = NOW()
      RETURNING slug, eyebrow, title, description, note, body
    `,
    [slug, normalized.eyebrow, normalized.title, normalized.description, normalized.note, normalized.body],
  );

  return resolveLegalDocument(slug, result.rows[0] ?? DEFAULT_LEGAL_DOCUMENTS[slug]);
}
