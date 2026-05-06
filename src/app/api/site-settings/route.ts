import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { getSiteContent } from '@/lib/server/communityStore';

export async function GET() {
  const content = await getSiteContent();

  return Response.json(
    content ?? {
      siteSettings: MOCK_SITE_SETTINGS,
      homeSeo: MOCK_HOME_SEO,
    },
  );
}
