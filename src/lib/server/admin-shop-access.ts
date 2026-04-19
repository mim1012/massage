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
