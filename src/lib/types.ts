export { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';

// ===== 업소(Shop) 관련 타입 =====
export interface Shop {
  id: string;
  name: string;              // 업소명
  slug: string;              // URL slug
  region: string;            // 지역 코드 (seoul, gyeonggi, etc.)
  regionLabel: string;       // 지역 한글명
  subRegion?: string;        // 지역구 코드 (gangnam, seocho, etc.)
  subRegionLabel?: string;   // 지역구 한글명 
  theme: string;             // 테마 코드
  themeLabel: string;        // 테마 한글명
  isPremium: boolean;        // 프리미엄(고정 상단) 여부
  premiumOrder?: number;     // 프리미엄 순서
  thumbnailUrl: string;      // 썸네일 이미지
  bannerUrl: string;         // 상세 배너 이미지
  images: string[];          // 갤러리 이미지
  tagline: string;           // 짧은 소개 문구
  description: string;       // 상세 소개
  address: string;           // 주소
  phone: string;             // 전화번호
  hours: string;             // 영업시간
  rating: number;            // 평점 (0~5)
  reviewCount: number;       // 후기 수
  courses: Course[];         // 코스/요금표
  tags: string[];            // 태그
  isVisible: boolean;        // 노출 여부 (어드민 제어)
  ownerId?: string;          // 제휴업체 관리자 계정 ID
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  heroMainText: string;
  heroSubText: string;
  contactPhone: string;
  footerInfo: string;
}

export interface HomeSeoContent {
  section1Title: string;
  section1Content: string;
  section2Title: string;
  section2Content: string;
  section3Title: string;
  section3Content: string;
}

export interface Course {
  name: string;
  duration: string;
  price: string;
  description?: string;
}

// ===== 후기(Review) =====
export interface Review {
  id: string;
  shopId: string;
  shopName: string;
  authorName: string;
  rating: number;
  content: string;
  isHidden?: boolean;
  createdAt: string;
}

// ===== 공지사항(Notice) =====
export interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

// ===== Q&A =====
export type QnACommentRole = 'ADMIN' | 'OWNER';

export interface QnAComment {
  id: string;
  qnaId: string;
  userId?: string;
  authorName: string;
  role: QnACommentRole;
  content: string;
  createdAt: string;
}

export interface QnA {
  id: string;
  shopId?: string;
  question: string;
  answer?: string; // legacy convenience field: latest operator comment
  authorName: string;
  isAnswered: boolean;
  canComment?: boolean;
  commentCount: number;
  latestCommentAt?: string;
  latestCommentPreview?: string;
  comments: QnAComment[];
  createdAt: string;
}

export interface PartnershipInquiry {
  id: string;
  shopName: string;
  region: string;
  subRegion: string;
  theme: string;
  contactName: string;
  phone: string;
  kakaoId?: string;
  message: string;
  status: 'pending' | 'contacted' | 'completed';
  createdAt: string;
}

// ===== 사용자(User) =====
export type UserRole = 'ADMIN' | 'OWNER' | 'USER';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  managedShopId?: string;  // OWNER인 경우 담당 업소 ID
  status?: 'pending' | 'approved' | 'rejected';
  businessName?: string;
  businessNumber?: string;
  phone?: string;
}

// ===== ??/?? ?? =====
export type RegionCode = 'all'
  | 'seoul'
  | 'gyeonggi'
  | 'incheon'
  | 'busan'
  | 'daejeon'
  | 'daegu'
  | 'gwangju'
  | 'ulsan'
  | 'gangwon'
  | 'chungcheong'
  | 'gyeongnam'
  | 'jeolla'
  | 'jeju';

export type ThemeCode = 'all'
  | 'swedish'
  | 'aroma'
  | 'thai'
  | 'sport'
  | 'deep'
  | 'hot_stone'
  | 'foot'
  | 'couple';
