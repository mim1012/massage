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

test('getBoardSummary and getAdminDashboardData reflect seeded counts', async () => {
  const summary = await getBoardSummary();
  assert.equal(typeof summary.notices, 'number');
  assert.equal(typeof summary.qna, 'number');
  assert.equal(typeof summary.reviews, 'number');
  assert.ok(summary.notices >= 0);
  assert.ok(summary.qna >= 0);
  assert.ok(summary.reviews >= 0);

  const dashboard = await getAdminDashboardData();
  assert.ok(dashboard.summary.length >= 4);
  assert.ok(dashboard.summary.every((item) => typeof item.value === 'number'));
  assert.ok(Array.isArray(dashboard.pendingQna));
  assert.ok(Array.isArray(dashboard.recentReviews));
});

test('updatePremiumOrder reorders premium shops and demotes omitted entries', async () => {
  const premiumBoard = await updatePremiumOrder(['shop-003', 'shop-001']);

  assert.deepEqual(
    premiumBoard.premiumShops.map((shop) => [shop.id, shop.premiumOrder]),
    [
      ['shop-003', 1],
      ['shop-001', 2],
    ],
  );
  assert.deepEqual(premiumBoard.availableShops.map((shop) => shop.id), ['shop-002']);
  assert.deepEqual(
    (await listAdminShops()).map((shop) => [shop.id, shop.isPremium, shop.premiumOrder]),
    [
      ['shop-003', true, 1],
      ['shop-001', true, 2],
      ['shop-002', false, undefined],
    ],
  );
});

test('notice lifecycle trims content and keeps pinned notices ahead of regular notices', async () => {
  const regularNotice = await createNotice({
    title: '  Regular update  ',
    content: '  Fresh content  ',
    isPinned: false,
    createdBy: 'test-admin',
  });

  assert.equal(regularNotice.title, 'Regular update');
  assert.equal(regularNotice.content, 'Fresh content');
  assert.equal((await listNotices())[0]?.id, 'notice-001');

  await sleep(5);

  const pinnedNotice = await createNotice({
    title: '  Pinned update  ',
    content: '  Important content  ',
    isPinned: true,
    createdBy: 'test-admin',
  });

  assert.equal((await listNotices())[0]?.id, pinnedNotice.id);

  const updated = await updateNotice(pinnedNotice.id, {
    title: '  Updated title  ',
    content: '  Updated body  ',
    isPinned: false,
  });

  assert.equal(updated?.title, 'Updated title');
  assert.equal(updated?.content, 'Updated body');
  assert.deepEqual(await getNoticeById(pinnedNotice.id), {
    id: pinnedNotice.id,
    title: 'Updated title',
    content: 'Updated body',
    isPinned: false,
    createdAt: pinnedNotice.createdAt,
  });

  assert.equal(await deleteNotice(pinnedNotice.id), true);
  assert.equal(await getNoticeById(pinnedNotice.id), null);
  assert.equal(await deleteNotice('missing-notice'), false);
});

test('Q&A creation and answering trim input and promote the newest matching entry', async () => {
  const created = await createQna({
    shopId: 'shop-001',
    question: '  Is weekend booking available?  ',
    authorName: '  Test User  ',
  });

  assert.equal(created.question, 'Is weekend booking available?');
  assert.equal(created.authorName, 'Test User');
  assert.equal((await listQna('shop-001'))[0]?.id, created.id);

  const answered = await answerQna(created.id, '  Yes, weekends are available.  ');

  assert.equal(answered?.answer, 'Yes, weekends are available.');
  assert.equal(answered?.isAnswered, true);
  assert.equal(await answerQna('missing-qna', 'No'), null);
});
