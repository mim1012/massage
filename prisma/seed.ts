import crypto from 'node:crypto';
import { PrismaClient, QnaStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ['error'],
});

const HASH_SEPARATOR = ':';
const KEY_LENGTH = 64;
const ADMIN_PASSWORD = 'admin1234';
const OWNER_PASSWORD = 'owner1234';
const USER_PASSWORD = 'user1234';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}${HASH_SEPARATOR}${derivedKey}`;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@massage.local' },
    update: {
      passwordHash: hashPassword(ADMIN_PASSWORD),
      name: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
    create: {
      email: 'admin@massage.local',
      passwordHash: hashPassword(ADMIN_PASSWORD),
      name: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@massage.local' },
    update: {
      passwordHash: hashPassword(OWNER_PASSWORD),
      name: 'Owner',
      role: UserRole.OWNER,
      status: UserStatus.APPROVED,
      phone: '010-1111-2222',
    },
    create: {
      email: 'owner@massage.local',
      passwordHash: hashPassword(OWNER_PASSWORD),
      name: 'Owner',
      role: UserRole.OWNER,
      status: UserStatus.APPROVED,
      phone: '010-1111-2222',
      ownerProfile: {
        create: {
          businessName: 'Healing Spa',
          businessNumber: '123-45-67890',
        },
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@massage.local' },
    update: {
      passwordHash: hashPassword(USER_PASSWORD),
      name: 'User',
      role: UserRole.USER,
      status: UserStatus.APPROVED,
    },
    create: {
      email: 'user@massage.local',
      passwordHash: hashPassword(USER_PASSWORD),
      name: 'User',
      role: UserRole.USER,
      status: UserStatus.APPROVED,
    },
  });

  const shop = await prisma.shop.upsert({
    where: { slug: 'healing-spa-seoul' },
    update: {
      ownerId: owner.id,
      name: 'Healing Spa Seoul',
      region: 'seoul',
      subRegion: 'gangnam',
      theme: 'swedish',
      tagline: 'Premium massage in the heart of Seoul',
      description: 'Sample seeded shop data for the initial backend integration.',
      address: '123 Gangnam-daero, Seoul',
      phone: '010-1234-5678',
      hours: '10:00 - 23:00',
      isVisible: true,
      isPremium: true,
      premiumOrder: 1,
      thumbnailUrl: '/images/seed-shop-thumb.jpg',
      bannerUrl: '/images/seed-shop-banner.jpg',
      regionLabel: 'Seoul',
      subRegionLabel: 'Gangnam',
      themeLabel: 'Swedish',
      rating: 4.8,
      tags: ['premium', 'parking', 'card'],
    },
    create: {
      ownerId: owner.id,
      name: 'Healing Spa Seoul',
      slug: 'healing-spa-seoul',
      region: 'seoul',
      subRegion: 'gangnam',
      theme: 'swedish',
      tagline: 'Premium massage in the heart of Seoul',
      description: 'Sample seeded shop data for the initial backend integration.',
      address: '123 Gangnam-daero, Seoul',
      phone: '010-1234-5678',
      hours: '10:00 - 23:00',
      isVisible: true,
      isPremium: true,
      premiumOrder: 1,
      thumbnailUrl: '/images/seed-shop-thumb.jpg',
      bannerUrl: '/images/seed-shop-banner.jpg',
      regionLabel: 'Seoul',
      subRegionLabel: 'Gangnam',
      themeLabel: 'Swedish',
      rating: 4.8,
      tags: ['premium', 'parking', 'card'],
      images: {
        create: [
          { imageUrl: '/images/seed-shop-1.jpg', sortOrder: 0 },
          { imageUrl: '/images/seed-shop-2.jpg', sortOrder: 1 },
        ],
      },
      courses: {
        create: [
          { name: 'Basic Swedish', durationMinutes: 60, price: 70000, sortOrder: 0 },
          { name: 'Premium Swedish', durationMinutes: 90, price: 100000, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.review.upsert({
    where: {
      id: 'seed-review-001',
    },
    update: {
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      rating: 5,
      content: 'Seed review for backend integration.',
    },
    create: {
      id: 'seed-review-001',
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      rating: 5,
      content: 'Seed review for backend integration.',
    },
  });

  await prisma.qnA.upsert({
    where: {
      id: 'seed-qna-001',
    },
    update: {
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      question: 'Can I book on weekends?',
      answer: 'Yes, weekend booking is available.',
      answeredBy: admin.id,
      answeredAt: new Date(),
      status: QnaStatus.ANSWERED,
    },
    create: {
      id: 'seed-qna-001',
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      question: 'Can I book on weekends?',
      answer: 'Yes, weekend booking is available.',
      answeredBy: admin.id,
      answeredAt: new Date(),
      status: QnaStatus.ANSWERED,
    },
  });

  await prisma.notice.upsert({
    where: {
      id: 'seed-notice-001',
    },
    update: {
      title: 'Seed Notice',
      content: 'Initial seeded notice for the project.',
      isPinned: true,
      createdBy: admin.id,
    },
    create: {
      id: 'seed-notice-001',
      title: 'Seed Notice',
      content: 'Initial seeded notice for the project.',
      isPinned: true,
      createdBy: admin.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
