export interface AdminShopListItem {
  id: string;
  name: string;
  region: string;
  regionLabel: string;
  subRegion?: string;
  subRegionLabel?: string;
  theme: string;
  themeLabel: string;
  phone: string;
  isVisible: boolean;
  isPremium: boolean;
  premiumOrder?: number;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummaryItem {
  label: string;
  value: number;
}

export interface AdminDashboardData {
  summary: DashboardSummaryItem[];
  pendingQna: {
    id: string;
    question: string;
    isAnswered: boolean;
  }[];
  recentReviews: {
    id: string;
    shopName: string;
    rating: number;
    content: string;
  }[];
}

export interface PremiumBoardData {
  premiumShops: AdminShopListItem[];
  availableShops: AdminShopListItem[];
}
