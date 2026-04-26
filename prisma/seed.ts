import crypto from 'node:crypto';
import { PrismaClient, QnaStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DEFAULT_SITE_SETTINGS = {
  siteName: '힐링찾기',
  siteTitle: '전국 제휴업소 디렉토리',
  siteDescription: 'HEALING DIRECTORY',
  heroMainText: '🔥 내 주변 최고의 힐링 업소 찾기',
  heroSubText: '전국 500개+ 제휴업소 | 매일 업데이트되는 검증된 정보',
  contactPhone: '1588-0000',
  footerInfo: '힐링찾기 | 대표자: 홍길동 | 사업자번호: 000-00-00000 | 서울특별시 강남구 테헤란로 123',
};

const DEFAULT_HOME_SEO = {
  section1Title: '힐링찾기 - 전국 마사지·힐링업소 디렉토리',
  section1Content:
    '힐링찾기는 전국 마사지·힐링 제휴업소를 지역별·테마별로 한눈에 비교할 수 있는 디렉토리 플랫폼입니다. 서울, 경기, 부산 등 전국 주요 도시의 검증된 업소를 소개합니다.',
  section2Title: '지역별 마사지 업소 찾기',
  section2Content:
    '강남, 홍대, 해운대 등 인기 지역부터 수원, 인천, 대전까지 다양한 지역의 업소를 손쉽게 검색하세요. 스웨디시, 아로마, 타이, 스포츠 마사지 등 테마별 필터로 원하는 업소를 빠르게 찾을 수 있습니다.',
  section3Title: '프리미엄 추천업소',
  section3Content:
    '매일 업데이트되는 프리미엄 추천업소를 통해 최고 수준의 서비스를 경험하세요. 업소 상세 페이지에서 코스 정보, 요금표, 실제 방문 후기를 확인할 수 있습니다.',
};

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
const SITE_SETTINGS_ID = 'default';

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
      isHidden: false,
    },
    create: {
      id: 'seed-review-001',
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      rating: 5,
      content: 'Seed review for backend integration.',
      isHidden: false,
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
      status: QnaStatus.ANSWERED,
    },
    create: {
      id: 'seed-qna-001',
      shopId: shop.id,
      userId: user.id,
      authorName: 'Seed User',
      question: 'Can I book on weekends?',
      status: QnaStatus.ANSWERED,
    },
  });

  await prisma.qnAComment.upsert({
    where: {
      id: 'seed-qna-comment-001',
    },
    update: {
      qnaId: 'seed-qna-001',
      userId: admin.id,
      authorName: 'Admin',
      role: 'ADMIN',
      content: 'Yes, weekend booking is available.',
    },
    create: {
      id: 'seed-qna-comment-001',
      qnaId: 'seed-qna-001',
      userId: admin.id,
      authorName: 'Admin',
      role: 'ADMIN',
      content: 'Yes, weekend booking is available.',
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

  await prisma.partnershipInquiry.upsert({
    where: { id: 'seed-partnership-001' },
    update: {
      shopName: 'Seed Partnership Shop',
      region: 'Seoul',
      subRegion: 'Gangnam',
      theme: 'Swedish',
      contactName: 'Seed Contact',
      phone: '010-9999-0000',
      kakaoId: 'seed_partner',
      message: 'Initial seeded partnership inquiry.',
      status: 'PENDING',
    },
    create: {
      id: 'seed-partnership-001',
      shopName: 'Seed Partnership Shop',
      region: 'Seoul',
      subRegion: 'Gangnam',
      theme: 'Swedish',
      contactName: 'Seed Contact',
      phone: '010-9999-0000',
      kakaoId: 'seed_partner',
      message: 'Initial seeded partnership inquiry.',
      status: 'PENDING',
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {
      siteName: DEFAULT_SITE_SETTINGS.siteName,
      siteTitle: DEFAULT_SITE_SETTINGS.siteTitle,
      siteDescription: DEFAULT_SITE_SETTINGS.siteDescription,
      heroMainText: DEFAULT_SITE_SETTINGS.heroMainText,
      heroSubText: DEFAULT_SITE_SETTINGS.heroSubText,
      contactPhone: DEFAULT_SITE_SETTINGS.contactPhone,
      footerInfo: DEFAULT_SITE_SETTINGS.footerInfo,
      seoSection1Title: DEFAULT_HOME_SEO.section1Title,
      seoSection1Content: DEFAULT_HOME_SEO.section1Content,
      seoSection2Title: DEFAULT_HOME_SEO.section2Title,
      seoSection2Content: DEFAULT_HOME_SEO.section2Content,
      seoSection3Title: DEFAULT_HOME_SEO.section3Title,
      seoSection3Content: DEFAULT_HOME_SEO.section3Content,
    },
    create: {
      id: SITE_SETTINGS_ID,
      siteName: DEFAULT_SITE_SETTINGS.siteName,
      siteTitle: DEFAULT_SITE_SETTINGS.siteTitle,
      siteDescription: DEFAULT_SITE_SETTINGS.siteDescription,
      heroMainText: DEFAULT_SITE_SETTINGS.heroMainText,
      heroSubText: DEFAULT_SITE_SETTINGS.heroSubText,
      contactPhone: DEFAULT_SITE_SETTINGS.contactPhone,
      footerInfo: DEFAULT_SITE_SETTINGS.footerInfo,
      seoSection1Title: DEFAULT_HOME_SEO.section1Title,
      seoSection1Content: DEFAULT_HOME_SEO.section1Content,
      seoSection2Title: DEFAULT_HOME_SEO.section2Title,
      seoSection2Content: DEFAULT_HOME_SEO.section2Content,
      seoSection3Title: DEFAULT_HOME_SEO.section3Title,
      seoSection3Content: DEFAULT_HOME_SEO.section3Content,
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
