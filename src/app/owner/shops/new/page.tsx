import ShopEditorPage from '@/components/admin/ShopEditorPage';

export default function OwnerNewShopPage() {
  return <ShopEditorPage params={Promise.resolve({ id: 'new' })} routeBase="/owner/shops" />;
}
