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

const SCREEN_SAMPLE_SHOPS = [
  {
    slug: 'aroma-balance-hongdae',
    name: '아로마 밸런스 홍대',
    region: 'seoul',
    subRegion: 'mapo',
    theme: 'aroma',
    tagline: '조용한 아로마 케어와 편안한 휴식',
    description: '모바일 카드와 프리미엄 영역 확인을 위한 샘플 업소입니다.',
    address: '서울특별시 마포구 와우산로 45',
    phone: '010-2345-6789',
    hours: '11:00 - 22:00',
    isPremium: true,
    premiumOrder: 2,
    regionLabel: '서울',
    subRegionLabel: '마포',
    themeLabel: '아로마',
    rating: 4.7,
    tags: ['아로마', '예약제', '카드'],
    courses: [
      { name: '아로마 릴ief', durationMinutes: 60, price: 65000, sortOrder: 0 },
      { name: '아로마 딥케어', durationMinutes: 90, price: 95000, sortOrder: 1 },
    ],
  },
  {
    slug: 'busan-thai-stretch',
    name: '부산 타이 스트레치',
    region: 'busan',
    subRegion: 'haeundae',
    theme: 'thai',
    tagline: '전통 타이 스트레칭과 회복 케어',
    description: '프리미엄 3번 샘플 업소입니다.',
    address: '부산광역시 해운대구 해운대로 200',
    phone: '010-3456-7890',
    hours: '09:00 - 24:00',
    isPremium: true,
    premiumOrder: 3,
    regionLabel: '부산',
    subRegionLabel: '해운대',
    themeLabel: '타이',
    rating: 4.9,
    tags: ['타이', '스트레칭', '커플'],
    courses: [
      { name: '타이 베이직', durationMinutes: 60, price: 55000, sortOrder: 0 },
      { name: '타이 롱코스', durationMinutes: 120, price: 100000, sortOrder: 1 },
    ],
  },
  {
    slug: 'suwon-deep-care',
    name: '수원 딥케어 테라피',
    region: 'gyeonggi',
    subRegion: 'suwon',
    theme: 'deep',
    tagline: '근육 피로를 푸는 딥티슈 전문 케어',
    description: '프리미엄 4번 샘플 업소입니다.',
    address: '경기도 수원시 팔달구 권광로 88',
    phone: '010-4567-8901',
    hours: '10:00 - 23:30',
    isPremium: true,
    premiumOrder: 4,
    regionLabel: '경기',
    subRegionLabel: '수원',
    themeLabel: '딥티슈',
    rating: 4.6,
    tags: ['딥티슈', '주차', '야간'],
    courses: [
      { name: '딥케어 60', durationMinutes: 60, price: 68000, sortOrder: 0 },
      { name: '딥케어 90', durationMinutes: 90, price: 98000, sortOrder: 1 },
    ],
  },
  {
    slug: 'incheon-sport-recovery',
    name: '인천 스포츠 리커버리',
    region: 'incheon',
    subRegion: 'bupyeong',
    theme: 'sport',
    tagline: '운동 후 회복을 위한 스포츠 마사지',
    description: '일반 업소 카드 확인용 샘플입니다.',
    address: '인천광역시 부평구 시장로 12',
    phone: '010-5678-9012',
    hours: '10:00 - 22:00',
    isPremium: false,
    regionLabel: '인천',
    subRegionLabel: '부평',
    themeLabel: '스포츠',
    rating: 4.5,
    tags: ['스포츠', '회복', '예약'],
    courses: [{ name: '스포츠 케어', durationMinutes: 60, price: 60000, sortOrder: 0 }],
  },
  {
    slug: 'daejeon-foot-healing',
    name: '대전 풋 힐링',
    region: 'daejeon',
    subRegion: 'seo',
    theme: 'foot',
    tagline: '가볍게 받기 좋은 발 관리',
    description: '일반 업소 카드 확인용 샘플입니다.',
    address: '대전광역시 서구 둔산로 20',
    phone: '010-6789-0123',
    hours: '12:00 - 23:00',
    isPremium: false,
    regionLabel: '대전',
    subRegionLabel: '서구',
    themeLabel: '풋케어',
    rating: 4.3,
    tags: ['풋케어', '가성비', '당일예약'],
    courses: [{ name: '풋 베이직', durationMinutes: 45, price: 45000, sortOrder: 0 }],
  },
  {
    slug: 'daegu-hot-stone-room',
    name: '대구 핫스톤 룸',
    region: 'daegu',
    subRegion: 'jung',
    theme: 'hot_stone',
    tagline: '따뜻한 스톤 테라피와 프라이빗 룸',
    description: '일반 업소 카드 확인용 샘플입니다.',
    address: '대구광역시 중구 중앙대로 10',
    phone: '010-7890-1234',
    hours: '11:00 - 24:00',
    isPremium: false,
    regionLabel: '대구',
    subRegionLabel: '중구',
    themeLabel: '핫스톤',
    rating: 4.4,
    tags: ['핫스톤', '프라이빗', '커플'],
    courses: [{ name: '핫스톤 테라피', durationMinutes: 80, price: 85000, sortOrder: 0 }],
  },
  {
    slug: 'gwangju-couple-aroma',
    name: '광주 커플 아로마',
    region: 'gwangju',
    subRegion: 'seo',
    theme: 'couple',
    tagline: '커플룸 중심의 아로마 테라피',
    description: '일반 업소 카드 확인용 샘플입니다.',
    address: '광주광역시 서구 상무대로 30',
    phone: '010-8901-2345',
    hours: '10:30 - 23:30',
    isPremium: false,
    regionLabel: '광주',
    subRegionLabel: '서구',
    themeLabel: '커플',
    rating: 4.6,
    tags: ['커플', '아로마', '룸'],
    courses: [{ name: '커플 아로마', durationMinutes: 90, price: 120000, sortOrder: 0 }],
  },
  {
    slug: 'ulsan-swedish-lounge',
    name: '울산 스웨디시 라운지',
    region: 'ulsan',
    subRegion: 'nam',
    theme: 'swedish',
    tagline: '부드러운 압의 스웨디시 라운지',
    description: '일반 업소 카드 확인용 샘플입니다.',
    address: '울산광역시 남구 삼산로 50',
    phone: '010-9012-3456',
    hours: '13:00 - 24:00',
    isPremium: false,
    regionLabel: '울산',
    subRegionLabel: '남구',
    themeLabel: '스웨디시',
    rating: 4.2,
    tags: ['스웨디시', '라운지', '야간'],
    courses: [{ name: '스웨디시 70', durationMinutes: 70, price: 75000, sortOrder: 0 }],
  },
] as const;

const GENERATED_REGION_SAMPLES = [
  { region: 'seoul', subRegion: 'gangnam', regionLabel: '서울', subRegionLabel: '강남' },
  { region: 'gyeonggi', subRegion: 'suwon', regionLabel: '경기', subRegionLabel: '수원' },
  { region: 'incheon', subRegion: 'bupyeong', regionLabel: '인천', subRegionLabel: '부평' },
  { region: 'daejeon', subRegion: 'seo', regionLabel: '대전', subRegionLabel: '서구' },
  { region: 'daegu', subRegion: 'jung', regionLabel: '대구', subRegionLabel: '중구' },
  { region: 'gwangju', subRegion: 'seo', regionLabel: '광주', subRegionLabel: '서구' },
  { region: 'busan', subRegion: 'haeundae', regionLabel: '부산', subRegionLabel: '해운대' },
  { region: 'ulsan', subRegion: 'nam', regionLabel: '울산', subRegionLabel: '남구' },
  { region: 'sejong', subRegion: 'sejong', regionLabel: '세종', subRegionLabel: '세종' },
  { region: 'gangwon', subRegion: 'chuncheon', regionLabel: '강원', subRegionLabel: '춘천' },
  { region: 'chungbuk', subRegion: 'cheongju', regionLabel: '충북', subRegionLabel: '청주' },
  { region: 'chungnam', subRegion: 'cheonan', regionLabel: '충남', subRegionLabel: '천안' },
  { region: 'gyeongbuk', subRegion: 'pohang', regionLabel: '경북', subRegionLabel: '포항' },
  { region: 'gyeongnam', subRegion: 'changwon', regionLabel: '경남', subRegionLabel: '창원' },
  { region: 'jeonbuk', subRegion: 'jeonju', regionLabel: '전북', subRegionLabel: '전주' },
  { region: 'jeonnam', subRegion: 'yeosu', regionLabel: '전남', subRegionLabel: '여수' },
  { region: 'jeju', subRegion: 'jeju', regionLabel: '제주', subRegionLabel: '제주' },
] as const;

const GENERATED_THEME_SAMPLES = [
  { theme: 'swedish', themeLabel: '스웨디시', courseName: '스웨디시 케어', tag: '스웨디시' },
  { theme: 'aroma', themeLabel: '아로마', courseName: '아로마 테라피', tag: '아로마' },
  { theme: 'thai', themeLabel: '타이', courseName: '타이 스트레칭', tag: '타이' },
  { theme: 'sport', themeLabel: '스포츠', courseName: '스포츠 회복', tag: '스포츠' },
  { theme: 'deep', themeLabel: '딥티슈', courseName: '딥티슈 집중', tag: '딥티슈' },
  { theme: 'hot_stone', themeLabel: '핫스톤', courseName: '핫스톤 테라피', tag: '핫스톤' },
  { theme: 'foot', themeLabel: '풋케어', courseName: '풋 베이직', tag: '풋케어' },
  { theme: 'couple', themeLabel: '커플', courseName: '커플 아로마', tag: '커플' },
] as const;

function buildGeneratedScreenSampleShops() {
  return Array.from({ length: 41 }, (_, index) => {
    const number = index + 1;
    const region = GENERATED_REGION_SAMPLES[index % GENERATED_REGION_SAMPLES.length];
    const theme = GENERATED_THEME_SAMPLES[index % GENERATED_THEME_SAMPLES.length];
    const price = 45000 + (index % 8) * 5000;
    const durationMinutes = 50 + (index % 5) * 10;

    return {
      slug: `sample-healing-shop-${String(number).padStart(2, '0')}`,
      name: `${region.regionLabel} ${theme.themeLabel} 샘플 ${String(number).padStart(2, '0')}`,
      region: region.region,
      subRegion: region.subRegion,
      theme: theme.theme,
      tagline: `${region.subRegionLabel}에서 확인하는 ${theme.themeLabel} 샘플 업소`,
      description: '목록, 필터, 모바일 카드 레이아웃 확인을 위한 로컬 시드 업소입니다.',
      address: `${region.regionLabel} ${region.subRegionLabel} 샘플로 ${100 + number}`,
      phone: `010-${String(2000 + number).padStart(4, '0')}-${String(5000 + number).padStart(4, '0')}`,
      hours: `${10 + (index % 4)}:00 - ${22 + (index % 3)}:00`,
      isPremium: false,
      regionLabel: region.regionLabel,
      subRegionLabel: region.subRegionLabel,
      themeLabel: theme.themeLabel,
      rating: Number((4.1 + (index % 9) * 0.1).toFixed(1)),
      tags: [theme.tag, region.subRegionLabel, index % 2 === 0 ? '예약제' : '당일예약'],
      courses: [
        { name: theme.courseName, durationMinutes, price, sortOrder: 0 },
        { name: `${theme.courseName} 플러스`, durationMinutes: durationMinutes + 30, price: price + 30000, sortOrder: 1 },
      ],
    };
  });
}

function getSamplePremiumOrder(sampleShop: { isPremium: boolean; premiumOrder?: number }) {
  return sampleShop.isPremium ? sampleShop.premiumOrder ?? 999 : null;
}

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

  const screenSampleShops = [...SCREEN_SAMPLE_SHOPS, ...buildGeneratedScreenSampleShops()];

  for (const [index, sampleShop] of screenSampleShops.entries()) {
    const savedShop = await prisma.shop.upsert({
      where: { slug: sampleShop.slug },
      update: {
        ownerId: owner.id,
        name: sampleShop.name,
        region: sampleShop.region,
        subRegion: sampleShop.subRegion,
        theme: sampleShop.theme,
        tagline: sampleShop.tagline,
        description: sampleShop.description,
        address: sampleShop.address,
        phone: sampleShop.phone,
        hours: sampleShop.hours,
        isVisible: true,
        isPremium: sampleShop.isPremium,
        premiumOrder: getSamplePremiumOrder(sampleShop),
        thumbnailUrl: `/images/sample-${index + 2}-thumb.jpg`,
        bannerUrl: `/images/sample-${index + 2}-banner.jpg`,
        regionLabel: sampleShop.regionLabel,
        subRegionLabel: sampleShop.subRegionLabel,
        themeLabel: sampleShop.themeLabel,
        rating: sampleShop.rating,
        tags: [...sampleShop.tags],
      },
      create: {
        ownerId: owner.id,
        name: sampleShop.name,
        slug: sampleShop.slug,
        region: sampleShop.region,
        subRegion: sampleShop.subRegion,
        theme: sampleShop.theme,
        tagline: sampleShop.tagline,
        description: sampleShop.description,
        address: sampleShop.address,
        phone: sampleShop.phone,
        hours: sampleShop.hours,
        isVisible: true,
        isPremium: sampleShop.isPremium,
        premiumOrder: getSamplePremiumOrder(sampleShop),
        thumbnailUrl: `/images/sample-${index + 2}-thumb.jpg`,
        bannerUrl: `/images/sample-${index + 2}-banner.jpg`,
        regionLabel: sampleShop.regionLabel,
        subRegionLabel: sampleShop.subRegionLabel,
        themeLabel: sampleShop.themeLabel,
        rating: sampleShop.rating,
        tags: [...sampleShop.tags],
      },
    });

    await prisma.shopImage.deleteMany({ where: { shopId: savedShop.id } });
    await prisma.shopImage.createMany({
      data: [
        { shopId: savedShop.id, imageUrl: `/images/sample-${index + 2}-1.jpg`, sortOrder: 0 },
        { shopId: savedShop.id, imageUrl: `/images/sample-${index + 2}-2.jpg`, sortOrder: 1 },
      ],
    });

    await prisma.shopCourse.deleteMany({ where: { shopId: savedShop.id } });
    await prisma.shopCourse.createMany({
      data: sampleShop.courses.map((course) => ({
        shopId: savedShop.id,
        name: course.name,
        durationMinutes: course.durationMinutes,
        price: course.price,
        sortOrder: course.sortOrder,
      })),
    });
  }

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
