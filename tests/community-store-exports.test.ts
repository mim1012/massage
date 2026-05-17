import assert from 'node:assert/strict';
import test from 'node:test';
import * as communityStore from '@/lib/server/communityStore';

const requiredExports = [
  'getAdminDashboardData',
  'listManagedReviews',
  'updateNotice',
  'updatePartnershipInquiryStatus',
  'deletePartnershipInquiry',
  'listPartnershipInquiries',
  'getQnaShopOwnerId',
  'answerQna',
  'createQnaComment',
  'deleteManagedReview',
  'getSiteContent',
  'upsertSiteContent',
  'getAdminShopById',
  'updateAdminShop',
  'createAdminShop',
  'createPartnershipInquiry',
  'createQna',
  'listReviews',
  'createReview',
] as const;

test('communityStore exports the board/admin APIs required by app routes', () => {
  for (const exportName of requiredExports) {
    assert.equal(typeof communityStore[exportName], 'function', `${exportName} should be exported as a function`);
  }
});
