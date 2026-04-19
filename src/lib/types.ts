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
export interface QnA {
  id: string;
  shopId?: string;
  question: string;
  answer?: string;
  authorName: string;
  isAnswered: boolean;
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

// ===== 지역/테마 목록 =====
export const REGIONS = [
  { code: 'all', label: '전체' },
  { code: 'seoul', label: '서울' },
  { code: 'gyeonggi', label: '경기' },
  { code: 'incheon', label: '인천' },
  { code: 'busan', label: '부산' },
  { code: 'daejeon', label: '대전' },
  { code: 'daegu', label: '대구' },
  { code: 'gwangju', label: '광주' },
  { code: 'ulsan', label: '울산' },
  { code: 'gangwon', label: '강원' },
  { code: 'chungcheong', label: '충청' },
  { code: 'gyeongsang', label: '경상' },
  { code: 'jeolla', label: '전라' },
  { code: 'jeju', label: '제주' },
] as const;

export const DISTRICTS: Record<string, { code: string; label: string }[]> = {
  seoul: [
    { code: 'all', label: '전체' },
    { code: 'gangnam', label: '강남' },
    { code: 'gangdong', label: '강동' },
    { code: 'gangbuk', label: '강북' },
    { code: 'gangseo', label: '강서' },
    { code: 'gongdeok', label: '공덕' },
    { code: 'gwanak', label: '관악' },
    { code: 'gwangjin', label: '광진' },
    { code: 'guro', label: '구로' },
    { code: 'geumcheon', label: '금천' },
    { code: 'nowon', label: '노원' },
    { code: 'dobong', label: '도봉' },
    { code: 'dongdaemun', label: '동대문' },
    { code: 'dongjak', label: '동작' },
    { code: 'mapo', label: '마포' },
    { code: 'seodaemun', label: '서대문' },
    { code: 'seocho', label: '서초' },
    { code: 'seongdong', label: '성동' },
    { code: 'seongbuk', label: '성북' },
    { code: 'songpa', label: '송파' },
    { code: 'yangcheon', label: '양천' },
    { code: 'yeongdeungpo', label: '영등포' },
    { code: 'yongsan', label: '용산' },
    { code: 'eunpyeong', label: '은평' },
    { code: 'jamsil', label: '잠실' },
    { code: 'jongno', label: '종로' },
    { code: 'junggu', label: '중구' },
    { code: 'jungnang', label: '중랑' },
  ],
  gyeonggi: [
    { code: 'all', label: '전체' },
    { code: 'gapyeong', label: '가평' },
    { code: 'godeok', label: '고덕' },
    { code: 'goyang', label: '고양' },
    { code: 'gwacheon', label: '과천' },
    { code: 'gwanggyo', label: '광교' },
    { code: 'gwangmyeong', label: '광명' },
    { code: 'gwangju_gy', label: '광주' },
    { code: 'guri', label: '구리' },
    { code: 'gunpo', label: '군포' },
    { code: 'gimpo', label: '김포' },
    { code: 'namyangju', label: '남양주' },
    { code: 'dongducheon', label: '동두천' },
    { code: 'dongtan', label: '동탄' },
    { code: 'byeongjeom', label: '병점' },
    { code: 'bucheon', label: '부천' },
    { code: 'bundang', label: '분당' },
    { code: 'seongnam', label: '성남' },
    { code: 'suwon', label: '수원' },
    { code: 'siheung', label: '시흥' },
    { code: 'ansan', label: '안산' },
    { code: 'anseong', label: '안성' },
    { code: 'anyang', label: '안양' },
    { code: 'yangju', label: '양주' },
    { code: 'yangpyeong', label: '양평' },
    { code: 'yeoju', label: '여주' },
    { code: 'yeoncheon', label: '연천' },
    { code: 'osan', label: '오산' },
    { code: 'yongin', label: '용인' },
    { code: 'wirye', label: '위례' },
    { code: 'uiwang', label: '의왕' },
    { code: 'uijeongbu', label: '의정부' },
    { code: 'icheon', label: '이천' },
    { code: 'ilsan', label: '일산' },
    { code: 'paju', label: '파주' },
    { code: 'pangyo', label: '판교' },
    { code: 'pyeongtaek', label: '평택' },
    { code: 'pocheon', label: '포천' },
    { code: 'hanam', label: '하남' },
    { code: 'hyangnam', label: '향남' },
    { code: 'hwaseong', label: '화성' },
  ],
  busan: [
    { code: 'all', label: '전체' },
    { code: 'haeundae', label: '해운대구' },
    { code: 'busanjin', label: '부산진구' },
    { code: 'dongnae', label: '동래구' },
    { code: 'suyeong', label: '수영구' },
    { code: 'namgu', label: '남구' },
    { code: 'geumjeong', label: '금정구' },
    { code: 'saha', label: '사하구' },
    { code: 'gangseo', label: '강서구' },
  ],
  incheon: [
    { code: 'all', label: '전체' },
    { code: 'gyeyang', label: '계양' },
    { code: 'namdong', label: '남동' },
    { code: 'michuhol', label: '미추홀구' },
    { code: 'bupyeong', label: '부평' },
    { code: 'seogu', label: '서구' },
    { code: 'songdo', label: '송도' },
    { code: 'yeonsu', label: '연수' },
    { code: 'junggu', label: '중구' },
    { code: 'cheongna', label: '청라' },
  ],
  daegu: [
    { code: 'all', label: '전체' },
    { code: 'suseong', label: '수성구' },
    { code: 'dalseo', label: '달서구' },
    { code: 'junggu', label: '중구' },
    { code: 'donggu', label: '동구' },
    { code: 'seogu', label: '서구' },
    { code: 'namgu', label: '남구' },
    { code: 'bukgu', label: '북구' },
    { code: 'dalseong', label: '달성군' },
  ],
  daejeon: [
    { code: 'all', label: '전체' },
    { code: 'yuseong', label: '유성구' },
    { code: 'seogu', label: '서구' },
    { code: 'junggu', label: '중구' },
    { code: 'donggu', label: '동구' },
    { code: 'daedeok', label: '대덕구' },
  ],
  gwangju: [
    { code: 'all', label: '전체' },
    { code: 'sangmu', label: '상무지구' },
    { code: 'seogu', label: '서구' },
    { code: 'bukgu', label: '북구' },
    { code: 'namgu', label: '남구' },
    { code: 'donggu', label: '동구' },
    { code: 'gwangsan', label: '광산구' },
  ],
  ulsan: [
    { code: 'all', label: '전체' },
    { code: 'namgu', label: '남구' },
    { code: 'junggu', label: '중구' },
    { code: 'bukgu', label: '북구' },
    { code: 'donggu', label: '동구' },
    { code: 'ulju', label: '울주군' },
  ],
  gangwon: [
    { code: 'all', label: '전체' },
    { code: 'wonju', label: '원주' },
    { code: 'chuncheon', label: '춘천' },
    { code: 'gangneung', label: '강릉' },
    { code: 'sokcho', label: '속초' },
  ],
  chungcheong: [
    { code: 'all', label: '전체' },
    { code: 'cheonan', label: '천안' },
    { code: 'asan', label: '아산' },
    { code: 'cheongju', label: '청주' },
    { code: 'chungju', label: '충주' },
    { code: 'dangjin', label: '당진' },
    { code: 'seosan', label: '서산' },
    { code: 'sejong', label: '세종시' },
  ],
  gyeongsang: [
    { code: 'all', label: '전체' },
    { code: 'changwon', label: '창원' },
    { code: 'gimhae', label: '김해' },
    { code: 'yangsan', label: '양산' },
    { code: 'geoje', label: '거제' },
    { code: 'pohang', label: '포항' },
    { code: 'gumi', label: '구미' },
    { code: 'gyeongsan', label: '경산' },
    { code: 'gyeongju', label: '경주' },
  ],
  jeolla: [
    { code: 'all', label: '전체' },
    { code: 'jeonju', label: '전주' },
    { code: 'iksan', label: '익산' },
    { code: 'gunsan', label: '군산' },
    { code: 'yeosu', label: '여수' },
    { code: 'suncheon', label: '순천' },
    { code: 'mokpo', label: '목포' },
  ],
  jeju: [
    { code: 'all', label: '전체' },
    { code: 'jeju_si', label: '제주시' },
    { code: 'seogwipo', label: '서귀포시' },
  ],
};

export const THEMES = [
  { code: 'all', label: '전체' },
  { code: 'swedish', label: '스웨디시' },
  { code: 'aroma', label: '아로마' },
  { code: 'thai', label: '타이' },
  { code: 'sport', label: '스포츠' },
  { code: 'deep', label: '딥티슈' },
  { code: 'hot_stone', label: '핫스톤' },
  { code: 'foot', label: '발마사지' },
  { code: 'couple', label: '커플' },
] as const;

export type RegionCode = typeof REGIONS[number]['code'];
export type ThemeCode = typeof THEMES[number]['code'];
