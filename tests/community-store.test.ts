import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { prisma } from '@/lib/db/prisma';
import {
  answerQna,
  createAdminShop,
  createNotice,
  createQna,
  deleteNotice,
  deleteManagedReview,
  deletePartnershipInquiry,
  getAdminShopById,
  getAdminDashboardData,
  getBoardLandingData,
  getBoardSummary,
  getNoticeById,
  getPublicSiteContent,
  getQnaShopOwnerId,
  getSiteContent,
  listManagedReviews,
  listAdminShops,
  listNotices,
  listPartnershipInquiries,
  listQna,
  updateNotice,
  updateAdminShop,
  updatePremiumOrder,
  updatePartnershipInquiryStatus,
  createPartnershipInquiry,
  listReviews,
  setReviewHiddenState,
  upsertSiteContent,
} from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';
import { sleep } from './helpers/reset-store';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

type DbTestFn = (context: TestContext) => Promise<void> | void;

function dbTest(name: string, fn: DbTestFn) {
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

async function createTempReview() {
  const owner = await getSeedOwner();
  const shop = await getSeedShop();
  const suffix = uniqueSuffix();

  return prisma.review.create({
    data: {
      shopId: shop.id,
      userId: owner.id,
      authorName: `Temp Reviewer ${suffix}`,
      rating: 4,
      content: `Temporary review ${suffix}`,
      isHidden: false,
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

dbTest('getBoardLandingData keeps board cards intact without loading full Q&A threads', async () => {
  const admin = await getAdminUser();
  const shop = await getSeedShop();
  const created = await createQna({
    shopId: shop.id,
    question: `Landing page question ${uniqueSuffix()}`,
    authorName: 'Landing Tester',
  });

  await answerQna(created.id, 'First landing answer', admin.id, admin.name);
  await answerQna(created.id, 'Latest landing answer', admin.id, admin.name);

  const landing = await getBoardLandingData({ includeReviews: true });
  const landingQna = landing.qnaEntries.find((entry) => entry.id === created.id);

  assert.ok(landingQna, 'expected newly created Q&A to appear in landing data');
  assert.equal(landing.qnaEntries.length <= 3, true);
  assert.equal(landing.reviews.length <= 3, true);
  assert.equal(landingQna?.question, created.question);
  assert.equal(landingQna?.answer, 'Latest landing answer');
  assert.equal(landingQna?.isAnswered, true);
  assert.equal(landingQna?.commentCount, 2);
  assert.deepEqual(landingQna?.comments, []);
});

dbTest('updatePremiumOrder reorders premium shops and demotes omitted entries', async (t: TestContext) => {
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

dbTest('Q&A creation and operator comments trim input and support multi-comment threads', async () => {
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

  const answered = await answerQna(created.id, '  Yes, weekends are available.  ', admin.id, admin.name);
  const answeredAgain = await answerQna(created.id, '  We also accept same-day bookings.  ', admin.id, admin.name);

  assert.equal(answered?.answer, 'Yes, weekends are available.');
  assert.equal(answered?.commentCount, 1);
  assert.equal(answered?.comments[0]?.content, 'Yes, weekends are available.');
  assert.equal(answeredAgain?.answer, 'We also accept same-day bookings.');
  assert.equal(answeredAgain?.isAnswered, true);
  assert.equal(answeredAgain?.commentCount, 2);
  assert.equal(answeredAgain?.comments[0]?.content, 'Yes, weekends are available.');
  assert.equal(answeredAgain?.comments[1]?.content, 'We also accept same-day bookings.');
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

dbTest('createAdminShop and updateAdminShop persist and replace nested shop data', async (t: TestContext) => {
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

dbTest('public site content reads normalize legacy values without writing during requests', async () => {
  const seeded = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });
  assert.ok(seeded, 'expected seeded site settings');

  const legacySiteName = `  Healing Finder ${uniqueSuffix()}  `;
  const legacyHeroText = '  메인  ';
  const legacySeoTitle = '  s1  ';

  await prisma.siteSettings.update({
    where: { id: 'default' },
    data: {
      siteName: legacySiteName,
      heroMainText: legacyHeroText,
      seoSection1Title: legacySeoTitle,
    },
  });

  const beforeRead = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  assert.ok(beforeRead, 'expected site settings row before public read');
  await sleep(5);

  const content = await getPublicSiteContent();
  const afterRead = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  assert.equal(content?.siteSettings.siteName, legacySiteName.trim());
  assert.equal(content?.siteSettings.heroMainText, legacyHeroText.trim());
  assert.equal(content?.homeSeo.section1Title, legacySeoTitle.trim());
  assert.equal(afterRead?.updatedAt.toISOString(), beforeRead.updatedAt.toISOString());
});

dbTest('site settings can be loaded and updated', async () => {
  const current = await getSiteContent();
  assert.ok(current, 'expected seeded site settings');

  const nextName = `Healing Finder ${uniqueSuffix()}`;
  const updated = await upsertSiteContent({
    ...current.siteSettings,
    ...current.homeSeo,
    siteName: nextName,
  });

  assert.equal(updated.siteSettings.siteName, nextName);

  const reloaded = await getSiteContent();
  assert.equal(reloaded?.siteSettings.siteName, nextName);
});

dbTest('partnership inquiries can be created, listed, updated, and deleted', async () => {
  const created = await createPartnershipInquiry({
    shopName: `Partnership ${uniqueSuffix()}`,
    region: 'Seoul',
    subRegion: 'Gangnam',
    theme: 'Swedish',
    contactName: 'Partner',
    phone: '010-1111-2222',
    kakaoId: 'partner_seed',
    message: 'Need listing support',
  });

  const listed = await listPartnershipInquiries();
  assert.equal(listed.some((entry) => entry.id === created.id), true);

  const updated = await updatePartnershipInquiryStatus(created.id, 'contacted');
  assert.equal(updated?.status, 'contacted');

  assert.equal(await deletePartnershipInquiry(created.id), true);
});

dbTest('hidden reviews stay in admin moderation lists but disappear from public review queries', async () => {
  const admin = await getAdminUser();
  const targetReview = await createTempReview();

  const hidden = await setReviewHiddenState(admin, targetReview.id, true);
  assert.equal(hidden?.isHidden, true);

  const publicReviewsAfter = await listReviews();
  assert.equal(publicReviewsAfter.some((review) => review.id === targetReview.id), false);

  const managedReviews = await listManagedReviews(admin);
  assert.equal(managedReviews.some((review) => review.id === targetReview.id && review.isHidden), true);

  const restored = await setReviewHiddenState(admin, targetReview.id, false);
  assert.equal(restored?.isHidden, false);

  const owner = await getSeedOwner();
  assert.equal(await deleteManagedReview({ id: owner.id, role: 'OWNER' }, targetReview.id), true);
});
