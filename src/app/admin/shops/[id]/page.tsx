import ShopEditorPage from '@/components/admin/ShopEditorPage';

export default function AdminShopEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ShopEditorPage params={params} routeBase="/admin/shops" />;
}
