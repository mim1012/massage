import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { ANALYTICS_SESSION_COOKIE_NAME, createAnalyticsSessionId } from '@/lib/analytics-session';
import { shouldTrackPath } from '@/lib/analytics';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getUserBySessionToken } from '@/lib/server/auth-store';

const PAGE_VIEW_DEDUP_WINDOW_MS = 30 * 1000;

type PageViewRequest = {
  path?: string;
  referrer?: string;
};

function hashIp(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sanitizeText(value: string | undefined, maxLength: number) {
  return value?.trim().slice(0, maxLength) || undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PageViewRequest;
    const path = sanitizeText(body.path, 500);

    if (!path || !shouldTrackPath(path.split('?')[0])) {
      return Response.json({ ok: true }, { status: 202 });
    }

    const cookieStore = await cookies();
    let analyticsSessionId = cookieStore.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;
    if (!analyticsSessionId) {
      analyticsSessionId = createAnalyticsSessionId();
      cookieStore.set(ANALYTICS_SESSION_COOKIE_NAME, analyticsSessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    const requestHeaders = await headers();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const currentUser = sessionToken ? await getUserBySessionToken(sessionToken) : null;
    const forwardedFor = requestHeaders.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || undefined;
    const userAgent = sanitizeText(requestHeaders.get('user-agent') || undefined, 500);
    const referrer = sanitizeText(body.referrer, 500);
    const normalizedPath = path.split('?')[0];

    let shopId: string | undefined;
    if (normalizedPath.startsWith('/shop/')) {
      const slug = decodeURIComponent(normalizedPath.replace('/shop/', ''));
      if (slug) {
        const shop = await prisma.shop.findUnique({
          where: { slug },
          select: { id: true },
        });
        shopId = shop?.id;
      }
    }

    const dedupeWhere = {
      sessionId: analyticsSessionId,
      path,
      createdAt: {
        gte: new Date(Date.now() - PAGE_VIEW_DEDUP_WINDOW_MS),
      },
    };

    const existing = await prisma.pageViewEvent.findFirst({
      where: dedupeWhere,
      select: { id: true },
    });

    if (!existing) {
      await prisma.pageViewEvent.create({
        data: {
          path,
          sessionId: analyticsSessionId,
          userId: currentUser?.id,
          shopId,
          ipHash: ip ? hashIp(ip) : undefined,
          userAgent,
          referrer,
        },
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 202 });
  }
}
