import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  answerQna,
  createNotice,
  createQna,
  deleteNotice,
  getAdminDashboardData,
  getBoardSummary,
  getNoticeById,
  listAdminShops,
  listNotices,
  listQna,
  updateNotice,
  updatePremiumOrder,
} from '@/lib/server/communityStore';
import { resetMockStore, sleep } from './helpers/reset-store';

beforeEach(() => {
  resetMockStore();
});

test('getBoardSummary and getAdminDashboardData reflect seeded counts', () => {
  assert.deepEqual(getBoardSummary(), {
    notices: 1,
    qna: 2,
    reviews: 3,
  });

  const dashboard = getAdminDashboardData();
  assert.deepEqual(
    dashboard.summary.map((item) => [item.label, item.value]),
    [
      ['전체 업소', 3],
      ['프리미엄 업소', 2],
      ['미답변 Q&A', 1],
      ['공지 수', 1],
    ],
  );
  assert.equal(dashboard.pendingQna.length, 1);
  assert.equal(dashboard.recentReviews.length, 3);
});

test('updatePremiumOrder reorders premium shops and demotes omitted entries', () => {
  const premiumBoard = updatePremiumOrder(['shop-003', 'shop-001']);

  assert.deepEqual(
    premiumBoard.premiumShops.map((shop) => [shop.id, shop.premiumOrder]),
    [
      ['shop-003', 1],
      ['shop-001', 2],
    ],
  );
  assert.deepEqual(premiumBoard.availableShops.map((shop) => shop.id), ['shop-002']);
  assert.deepEqual(
    listAdminShops().map((shop) => [shop.id, shop.isPremium, shop.premiumOrder]),
    [
      ['shop-003', true, 1],
      ['shop-001', true, 2],
      ['shop-002', false, undefined],
    ],
  );
});

test('notice lifecycle trims content and keeps pinned notices ahead of regular notices', async () => {
  const regularNotice = createNotice({
    title: '  Regular update  ',
    content: '  Fresh content  ',
    isPinned: false,
  });

  assert.equal(regularNotice.title, 'Regular update');
  assert.equal(regularNotice.content, 'Fresh content');
  assert.equal(listNotices()[0]?.id, 'notice-001');

  await sleep(5);

  const pinnedNotice = createNotice({
    title: '  Pinned update  ',
    content: '  Important content  ',
    isPinned: true,
  });

  assert.equal(listNotices()[0]?.id, pinnedNotice.id);

  const updated = updateNotice(pinnedNotice.id, {
    title: '  Updated title  ',
    content: '  Updated body  ',
    isPinned: false,
  });

  assert.equal(updated?.title, 'Updated title');
  assert.equal(updated?.content, 'Updated body');
  assert.deepEqual(getNoticeById(pinnedNotice.id), {
    id: pinnedNotice.id,
    title: 'Updated title',
    content: 'Updated body',
    isPinned: false,
    createdAt: pinnedNotice.createdAt,
  });

  assert.equal(deleteNotice(pinnedNotice.id), true);
  assert.equal(getNoticeById(pinnedNotice.id), null);
  assert.equal(deleteNotice('missing-notice'), false);
});

test('Q&A creation and answering trim input and promote the newest matching entry', () => {
  const created = createQna({
    shopId: 'shop-001',
    question: '  Is weekend booking available?  ',
    authorName: '  Test User  ',
  });

  assert.equal(created.question, 'Is weekend booking available?');
  assert.equal(created.authorName, 'Test User');
  assert.equal(listQna('shop-001')[0]?.id, created.id);

  const answered = answerQna(created.id, '  Yes, weekends are available.  ');

  assert.equal(answered?.answer, 'Yes, weekends are available.');
  assert.equal(answered?.isAnswered, true);
  assert.equal(answerQna('missing-qna', 'No'), null);
});
