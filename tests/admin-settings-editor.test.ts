import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_LEGAL_DOCUMENTS } from '@/lib/legal-documents';
import { DEFAULT_HOME_SEO, DEFAULT_SITE_SETTINGS } from '@/lib/site-content-defaults';
import {
  createDefaultAdminSettingsState,
  getAdminSettingsDirtyState,
  resetLegalDocumentToDefault,
} from '@/app/admin/settings/editor-state';

test('getAdminSettingsDirtyState detects unsaved site and seo changes', () => {
  const baseline = createDefaultAdminSettingsState({
    siteSettings: DEFAULT_SITE_SETTINGS,
    homeSeo: DEFAULT_HOME_SEO,
    legalDocs: DEFAULT_LEGAL_DOCUMENTS,
  });

  const dirty = getAdminSettingsDirtyState({
    baseline,
    siteForm: { ...baseline.siteForm, siteName: `${baseline.siteForm.siteName} 수정` },
    seoForm: { ...baseline.seoForm, section1Title: `${baseline.seoForm.section1Title} 수정` },
    legalDocs: baseline.legalDocs,
  });

  assert.equal(dirty.hasSiteChanges, true);
  assert.equal(dirty.hasSeoChanges, true);
  assert.equal(dirty.hasAnyChanges, true);
  assert.equal(dirty.legalDocs.privacy, false);
});

test('getAdminSettingsDirtyState detects per-document changes only for edited legal docs', () => {
  const baseline = createDefaultAdminSettingsState({
    siteSettings: DEFAULT_SITE_SETTINGS,
    homeSeo: DEFAULT_HOME_SEO,
    legalDocs: DEFAULT_LEGAL_DOCUMENTS,
  });

  const dirty = getAdminSettingsDirtyState({
    baseline,
    siteForm: baseline.siteForm,
    seoForm: baseline.seoForm,
    legalDocs: {
      ...baseline.legalDocs,
      youth: {
        ...baseline.legalDocs.youth,
        title: `${baseline.legalDocs.youth.title} 수정`,
      },
    },
  });

  assert.equal(dirty.hasSiteChanges, false);
  assert.equal(dirty.hasSeoChanges, false);
  assert.equal(dirty.legalDocs.youth, true);
  assert.equal(dirty.legalDocs.privacy, false);
  assert.equal(dirty.hasAnyChanges, true);
});

test('resetLegalDocumentToDefault keeps saved metadata while restoring default copy', () => {
  const reset = resetLegalDocumentToDefault('ad', {
    ...DEFAULT_LEGAL_DOCUMENTS.ad,
    title: '임시 광고안내',
    updatedAt: '2026-04-27T07:00:00.000Z',
  });

  assert.equal(reset.title, DEFAULT_LEGAL_DOCUMENTS.ad.title);
  assert.equal(reset.body, DEFAULT_LEGAL_DOCUMENTS.ad.body);
  assert.equal(reset.updatedAt, '2026-04-27T07:00:00.000Z');
});


test('getAdminSettingsDirtyState ignores updatedAt-only changes in legal documents', () => {
  const baseline = createDefaultAdminSettingsState({
    siteSettings: DEFAULT_SITE_SETTINGS,
    homeSeo: DEFAULT_HOME_SEO,
    legalDocs: DEFAULT_LEGAL_DOCUMENTS,
  });

  const dirty = getAdminSettingsDirtyState({
    baseline,
    siteForm: baseline.siteForm,
    seoForm: baseline.seoForm,
    legalDocs: {
      ...baseline.legalDocs,
      privacy: {
        ...baseline.legalDocs.privacy,
        updatedAt: '2026-04-27T08:00:00.000Z',
      },
    },
  });

  assert.equal(dirty.legalDocs.privacy, false);
  assert.equal(dirty.hasAnyChanges, false);
});
