import ShopEditorPage from '@/components/admin/ShopEditorPage';

type AdminShopEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminShopEditorPage({ params }: AdminShopEditorPageProps) {
  return <ShopEditorPage params={params} routeBase="/admin/shops" />;
}