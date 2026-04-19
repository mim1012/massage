import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '@/lib/db/prisma';
import {
  answerQna,
  createAdminShop,
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
  updateAdminShop,
  updatePremiumOrder,
} from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';
import { sleep } from './helpers/reset-store';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function dbTest(name: Parameters<typeof test>[0], fn: Parameters<typeof test>[1]) {
  return test(name, { concurrency: false }, fn);
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

function buildShopInput(overrides: Partial<Shop> = {}): Shop {
  const suffix = uniqueSuffix();
  return {
    id: `shop-${suffix}`,
    name: `Managed Shop ${suffix}`,
    slug: `managed-shop-${suffix}`,
    region: 'seoul',
    regionLabel: 'Seoul',
    subRegion: 'gangnam',
    subRegionLabel: 'Gangnam',
    theme: 'swedish',
    themeLabel: 'Swedish',
    isPremium: false,
    premiumOrder: undefined,
    thumbnailUrl: '/images/a.jpg',
    bannerUrl: '/images/b.jpg',
    images: ['/images/a.jpg', '/images/b.jpg'],
    tagline: 'Initial tagline',
    description: 'Initial description',
    address: '123 Test Road',
    phone: '010-0000-0000',
    hours: '10:00 - 22:00',
    rating: 4.5,
    reviewCount: 0,
    courses: [
      { name: 'Basic', duration: '60 min', price: '70000', description: 'Starter' },
      { name: 'Premium', duration: '90 min', price: '100000', description: 'Advanced' },
    ],
    tags: ['test'],
    isVisible: true,
    ownerId: 'owner-source',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

dbTest('getBoardSummary and getAdminDashboardData reflect database counts', async () => {
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

dbTest('updatePremiumOrder reorders premium shops and demotes omitted entries', async (t) => {
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

dbTest('notice lifecycle trims content and keeps pinned notices ahead of regular notices', async () => {
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

dbTest('Q&A creation and answering trim input and promote the newest matching entry', async () => {
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

dbTest('store ownership lookups resolve shop and Q&A ownership for authorization checks', async () => {
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

dbTest('createAdminShop and updateAdminShop persist and replace nested shop data', async (t) => {
  const owner = await getSeedOwner();
  const shopInput = buildShopInput({ ownerId: owner.id });
  const createdShop = await createAdminShop(shopInput);

  t.after(async () => {
    await prisma.shop.deleteMany({ where: { id: createdShop.id } });
  });

  assert.equal(createdShop.name, shopInput.name);
  assert.deepEqual(createdShop.images, shopInput.images);
  assert.deepEqual(
    createdShop.courses.map((course) => [course.name, course.duration, course.price]),
    shopInput.courses.map((course) => [course.name, course.duration, course.price]),
  );

  const updatedShop = await updateAdminShop(
    createdShop.id,
    buildShopInput({
      ...createdShop,
      id: createdShop.id,
      slug: createdShop.slug,
      ownerId: createdShop.ownerId,
      name: `${createdShop.name} Updated`,
      images: ['/images/c.jpg'],
      courses: [{ name: 'Express', duration: '30 min', price: '40000', description: 'Quick' }],
    }),
  );

  assert.ok(updatedShop);
  assert.equal(updatedShop?.name, `${createdShop.name} Updated`);
  assert.deepEqual(updatedShop?.images, ['/images/c.jpg']);
  assert.deepEqual(updatedShop?.courses, [
    { name: 'Express', duration: '30 min', price: '40000', description: 'Quick' },
  ]);
});
