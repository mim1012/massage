const PREWARM_PATHS = [
  '/api/shops?regularOffset=0&regularLimit=30',
  '/api/shops?region=seoul&regularOffset=0&regularLimit=30',
  '/api/shops?region=gyeonggi&regularOffset=0&regularLimit=30',
  '/api/shops?region=busan&regularOffset=0&regularLimit=30',
  '/api/shops?view=theme&theme=swedish&regularOffset=0&regularLimit=30',
  '/api/shops?view=theme&theme=aroma&regularOffset=0&regularLimit=30',
  '/api/shops?view=theme&theme=thai&regularOffset=0&regularLimit=30',
  '/api/themes',
];

export const preferredRegion = 'sin1';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const startedAt = Date.now();
  const results = await Promise.all(
    PREWARM_PATHS.map(async (path) => {
      const started = Date.now();
      try {
        const response = await fetch(`${origin}${path}`);
        await response.arrayBuffer();
        return {
          path,
          status: response.status,
          cache: response.headers.get('x-vercel-cache') ?? null,
          ms: Date.now() - started,
        };
      } catch (error) {
        return {
          path,
          status: 0,
          cache: null,
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : 'unknown',
        };
      }
    }),
  );

  return Response.json(
    {
      ok: results.every((result) => result.status >= 200 && result.status < 400),
      durationMs: Date.now() - startedAt,
      results,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
