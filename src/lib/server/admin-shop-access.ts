import type { Shop, User } from '@/lib/types';

export function normalizeShopInputForSave(
  user: Pick<User, 'id' | 'role'>,
  shop: Shop,
  existingShop?: Pick<Shop, 'ownerId' | 'isPremium' | 'premiumOrder' | 'isVisible'>,
) {
  if (user.role !== 'OWNER') {
    return shop;
  }

  if (!existingShop) {
    return {
      ...shop,
      ownerId: user.id,
      isPremium: false,
      premiumOrder: undefined,
      // 오너 신규 등록 매장은 관리자 검수 후 공개된다 (오너 화면 안내 문구와 동일 정책).
      isVisible: false,
    };
  }

  return {
    ...shop,
    ownerId: existingShop.ownerId,
    isPremium: existingShop.isPremium,
    premiumOrder: existingShop.premiumOrder,
    isVisible: existingShop.isVisible,
  };
}
