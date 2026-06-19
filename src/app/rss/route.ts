import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listDirectoryShops } from '@/lib/server/shop-store';

const FEED_TTL_SECONDS = 300;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const [siteContent, shops] = await Promise.all([
    getPublicSiteContent(),
    listDirectoryShops({ regularOffset: 0, regularLimit: 30 }),
  ]);
  const baseUrl = getBaseUrl(request);
  const siteName = siteContent?.siteSettings.siteName ?? '힐링찾기';
  const siteDescription = siteContent?.siteSettings.siteDescription ?? '전국 제휴업소 디렉토리';
  const items = shops.allShops.slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items
  .map(
    (shop) => `    <item>
      <title>${escapeXml(shop.name)}</title>
      <link>${baseUrl}/shop/${encodeURIComponent(shop.slug)}</link>
      <guid>${baseUrl}/shop/${encodeURIComponent(shop.slug)}</guid>
      <description>${escapeXml(shop.tagline || `${shop.regionLabel} ${shop.themeLabel} 업소`)}</description>
      <pubDate>${new Date(shop.createdAt).toUTCString()}</pubDate>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${FEED_TTL_SECONDS}, stale-while-revalidate=${FEED_TTL_SECONDS}`,
    },
  });
}
