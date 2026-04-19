import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '@/lib/db/prisma';
import {
  answerQna,
  createNotice,
  createQna,
  deleteNotice,
  getAdminShopById,
  getAdminDashboardData,
  getBoardSummary,
  getNoticeById,
  getQnaShopOwnerId,
  listAdminShops,
  listNotices,
  listQna,
  updateNotice,
  updatePremiumOrder,
} from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';
import { sleep } from './helpers/reset-store';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function withMutedConsoleError<T>(callback: () => Promise<T>) {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    return await callback();
  } finally {
    console.error = originalConsoleError;
  }
}

async function getAdminUser() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@massage.local' },
  });

  assert.ok(admin, 'expected seeded admin user');
  return admin;
}

async function getSeedShop() {
  const shop = await prisma.shop.findUnique({
    where: { slug: 'healing-spa-seoul' },
  });

  assert.ok(shop, 'expected seeded shop');
  return shop;
}

async function getSeedOwner() {
  const owner = await prisma.user.findUnique({
    where: { email: 'owner@massage.local' },
  });

  assert.ok(owner, 'expected seeded owner user');
  return owner;
}

async function createTempShop(partial: Partial<Shop> = {}) {
  const suffix = uniqueSuffix();
  return prisma.shop.create({
    data: {
      name: partial.name ?? `Test Shop ${suffix}`,
      slug: partial.slug ?? `test-shop-${suffix}`,
      region: partial.region ?? 'seoul',
      regionLabel: partial.regionLabel ?? 'Seoul',
      subRegion: partial.subRegion ?? 'gangnam',
      subRegionLabel: partial.subRegionLabel ?? 'Gangnam',
      theme: partial.theme ?? 'swedish',
      themeLabel: partial.themeLabel ?? 'Swedish',
      tagline: partial.tagline ?? 'Test tagline',
      description: partial.description ?? 'Test description',
      address: partial.address ?? '123 Test Road',
      phone: partial.phone ?? '010-0000-0000',
      hours: partial.hours ?? '10:00 - 22:00',
      isVisible: partial.isVisible ?? true,
      isPremium: partial.isPremium ?? false,
      premiumOrder: partial.premiumOrder ?? null,
      thumbnailUrl: partial.thumbnailUrl ?? '/images/test-thumb.jpg',
      bannerUrl: partial.bannerUrl ?? '/images/test-banner.jpg',
      rating: partial.rating ?? 4.5,
      tags: partial.tags ?? ['test'],
    },
  });
}

test('getBoardSummary and getAdminDashboardData reflect database counts', async () => {
  const [noticeCount, qnaCount, reviewCount, shopCount, premiumCount, unansweredCount] = await Promise.all([
    prisma.notice.count(),
    prisma.qnA.count(),
    prisma.review.count(),
    prisma.shop.count(),
    prisma.shop.count({ where: { isPremium: true } }),
    prisma.qnA.count({ where: { status: 'OPEN' } }),
  ]);

  assert.deepEqual(await getBoardSummary(), {
    notices: noticeCount,
    qna: qnaCount,
    reviews: reviewCount,
  });

  const dashboard = await getAdminDashboardData();
  const summaryValues = dashboard.summary.map((item) => item.value).sort((a, b) => a - b);
  const expectedValues = [shopCount, premiumCount, unansweredCount, noticeCount].sort((a, b) => a - b);
  assert.deepEqual(summaryValues, expectedValues);
  assert.ok(dashboard.pendingQna.length <= 4);
  assert.ok(dashboard.recentReviews.length <= 4);
});

test('updatePremiumOrder reorders premium shops and demotes omitted entries', async (t) => {
  const tempShopA = await createTempShop({ isPremium: true, premiumOrder: 10 });
  const tempShopB = await createTempShop({ isPremium: false });

  t.after(async () => {
    await prisma.shop.deleteMany({
      where: { id: { in: [tempShopA.id, tempShopB.id] } },
    });
  });

  const premiumBoard = await updatePremiumOrder([tempShopB.id, tempShopA.id]);

  assert.deepEqual(
    premiumBoard.premiumShops.map((shop) => [shop.id, shop.premiumOrder]),
    [
      [tempShopB.id, 1],
      [tempShopA.id, 2],
    ],
  );

  const shops = await listAdminShops();
  const premiumShops = shops.filter((shop) => shop.isPremium);
  assert.deepEqual(
    premiumShops.slice(0, 2).map((shop) => [shop.id, shop.premiumOrder]),
    [
      [tempShopB.id, 1],
      [tempShopA.id, 2],
    ],
  );
});

test('notice lifecycle trims content and keeps pinned notices ahead of regular notices', async () => {
  const admin = await getAdminUser();

  const regularNotice = await createNotice({
    title: '  Regular update  ',
    content: '  Fresh content  ',
    isPinned: false,
    createdBy: admin.id,
  });

  assert.equal(regularNotice.title, 'Regular update');
  assert.equal(regularNotice.content, 'Fresh content');

  await sleep(5);

  const pinnedNotice = await createNotice({
    title: '  Pinned update  ',
    content: '  Important content  ',
    isPinned: true,
    createdBy: admin.id,
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

  assert.equal(await deleteNotice(regularNotice.id), true);
  assert.equal(await deleteNotice(pinnedNotice.id), true);
  assert.equal(await getNoticeById(pinnedNotice.id), null);
  assert.equal(
    await withMutedConsoleError(async () => deleteNotice('missing-notice')),
    false,
  );
});

test('Q&A creation and answering trim input and promote the newest matching entry', async () => {
  const admin = await getAdminUser();
  const shop = await getSeedShop();

  const created = await createQna({
    shopId: shop.id,
    question: '  Is weekend booking available?  ',
    authorName: '  Test User  ',
  });

  assert.equal(created.question, 'Is weekend booking available?');
  assert.equal(created.authorName, 'Test User');
  assert.equal((await listQna(shop.id))[0]?.id, created.id);

  const answered = await answerQna(created.id, '  Yes, weekends are available.  ', admin.id);

  assert.equal(answered?.answer, 'Yes, weekends are available.');
  assert.equal(answered?.isAnswered, true);
  assert.equal(
    await withMutedConsoleError(async () => answerQna('missing-qna', 'No', admin.id)),
    null,
  );
});

test('store ownership lookups resolve shop and Q&A ownership for authorization checks', async () => {
  const [owner, shop] = await Promise.all([getSeedOwner(), getSeedShop()]);

  const adminShop = await getAdminShopById(shop.id);
  assert.equal(adminShop?.ownerId, owner.id);

  const createdQna = await createQna({
    shopId: shop.id,
    question: 'Owner access check?',
    authorName: 'Verifier',
  });

  const qnaOwner = await getQnaShopOwnerId(createdQna.id);
  assert.deepEqual(qnaOwner, {
    exists: true,
    ownerId: owner.id,
  });

  assert.deepEqual(await getQnaShopOwnerId('missing-qna-id'), {
    exists: false,
    ownerId: null,
  });
});
