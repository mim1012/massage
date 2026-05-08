import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const connectionString = 'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Site Settings
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: '건마에반하다',
      siteTitle: '대한민국 NO.1 마사지 커뮤니티',
      siteDescription: '전국 마사지, 스웨디시, 1인샵 정보를 한눈에!',
      heroMainText: '내 주변 최고의 힐링 스팟을 찾아보세요',
      heroSubText: '강남, 홍대, 부산 등 전국 3000개 이상의 제휴 업소와 함께합니다.',
      contactPhone: '010-1234-5678',
      footerInfo: '(주)힐링네트워크 | 대표자: 홍길동 | 사업자번호: 123-45-67890',
      seoSection1Title: '마사지 정보의 모든 것',
      seoSection1Content: '마사지, 스웨디시, 아로마, 타이 등 다양한 테마별 업소를 확인하세요.',
      seoSection2Title: '정확한 리뷰와 평점',
      seoSection2Content: '실제 이용객들의 생생한 후기로 검증된 업소만 추천해 드립니다.',
      seoSection3Title: '입점 및 제휴 문의',
      seoSection3Content: '성공적인 비즈니스를 위한 최고의 파트너가 되어 드립니다.',
    },
  });
  console.log('✅ Site settings created');

  // 2. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: 'hashed_password', // Just for testing
      name: '관리자',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });
  console.log('✅ Admin user created');

  // 3. Create some Shops
  const shopsData = [
    {
      name: '강남 더힐링',
      slug: 'gangnam-the-healing',
      region: '서울',
      regionLabel: '서울',
      subRegion: 'gangnam',
      subRegionLabel: '강남구',
      theme: 'swedish',
      themeLabel: '스웨디시',
      tagline: '강남 최고의 힐링 공간',
      description: '품격 있는 인테리어와 최고의 실력을 자랑하는 강남 더힐링입니다.',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      hours: '10:00 ~ 익일 05:00',
      isPremium: true,
      premiumOrder: 1,
      rating: 4.8,
      tags: ['강남', '스웨디시', '인기'],
    },
    {
      name: '분당 1인샵 수진',
      slug: 'bundang-sujin',
      region: '경기',
      regionLabel: '경기',
      subRegion: 'bundang',
      subRegionLabel: '분당구',
      theme: 'one_person',
      themeLabel: '1인샵',
      tagline: '프라이빗한 1대1 케어',
      description: '오직 당신만을 위한 맞춤형 힐링 케어를 선사합니다.',
      address: '경기도 성남시 분당구 정자역 인근',
      phone: '010-9876-5432',
      hours: '11:00 ~ 23:00',
      isPremium: true,
      premiumOrder: 2,
      rating: 4.9,
      tags: ['분당', '1인샵', '프라이빗'],
    },
    {
      name: '홍대 타이 매니아',
      slug: 'hongdae-thai',
      region: '서울',
      regionLabel: '서울',
      subRegion: 'mapo',
      subRegionLabel: '마포구',
      theme: 'thai',
      themeLabel: '타이',
      tagline: '태국 정통 마사지',
      description: '태국 현지의 느낌 그대로, 정통 타이 마사지를 경험해 보세요.',
      address: '서울시 마포구 양화로 45',
      phone: '02-555-7777',
      hours: '24시간 연중무휴',
      isPremium: false,
      rating: 4.5,
      tags: ['홍대', '타이', '24시간'],
    },
    {
      name: '인천 연수 아로마',
      slug: 'incheon-yeonsu-aroma',
      region: '인천',
      regionLabel: '인천',
      subRegion: 'yeonsu',
      subRegionLabel: '연수구',
      theme: 'aroma',
      themeLabel: '아로마',
      tagline: '향기로운 힐링 시간',
      description: '고급 아로마 오일을 사용한 정성스러운 케어를 약속드립니다.',
      address: '인천광역시 연수구 송도동 789',
      phone: '032-123-4567',
      hours: '12:00 ~ 04:00',
      isPremium: false,
      rating: 4.2,
      tags: ['인천', '아로마', '송도'],
    },
  ];

  for (const data of shopsData) {
    await prisma.shop.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }
  console.log('✅ Shops created');

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
