import ShopEditorPage from '@/components/admin/ShopEditorPage';

export default function OwnerShopEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ShopEditorPage params={params} routeBase="/owner/shops" />;
}
