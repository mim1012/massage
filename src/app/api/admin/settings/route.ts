import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { getSiteContent, upsertSiteContent } from '@/lib/server/communityStore';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';

type SiteContentPayload = SiteSettings & HomeSeoContent;

export async function GET() {
  try {
    await requireRole('ADMIN');
    return Response.json(await getSiteContent());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole('ADMIN');
    const body = (await request.json()) as Partial<SiteContentPayload>;

    const requiredFields: Array<keyof SiteContentPayload> = [
      'siteName',
      'siteTitle',
      'siteDescription',
      'heroMainText',
      'heroSubText',
      'contactPhone',
      'footerInfo',
      'section1Title',
      'section1Content',
      'section2Title',
      'section2Content',
      'section3Title',
      'section3Content',
    ];

    if (requiredFields.some((field) => !body[field]?.trim())) {
      return Response.json({ error: 'all site settings fields are required.' }, { status: 400 });
    }

    return Response.json(
      await upsertSiteContent(body as SiteContentPayload),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
