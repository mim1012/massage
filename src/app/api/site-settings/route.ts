import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { getPublicSiteContent } from '@/lib/server/communityStore';

export async function GET() {
  const content = await getPublicSiteContent();

  return Response.json(
    content ?? {
      siteSettings: MOCK_SITE_SETTINGS,
      homeSeo: MOCK_HOME_SEO,
    },
  );
}
