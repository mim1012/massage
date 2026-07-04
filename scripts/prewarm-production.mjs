const baseUrl = process.env.BASE_URL ?? process.argv[2] ?? 'https://massage-green.vercel.app';

const paths = [
  '/',
  '/api/shops?regularLimit=60&regularOffset=0',
  '/api/shops?regularLimit=60&regularOffset=60',
  '/api/shops?region=seoul&sort=popular&regularLimit=60',
  '/api/shops?view=theme&theme=swedish&regularLimit=60',
  '/api/shops?view=theme&region=seoul&theme=swedish&sort=popular&regularLimit=60',
  '/api/shops/top',
  '/api/shops/top?region=seoul',
  '/api/shops?q=%EB%9F%B0%EC%B9%AD%EA%B2%80%EC%A6%9D&regularLimit=30',
  '/api/shops/launch-scale-0001',
  '/api/board/summary',
  '/api/site-settings',
  '/api/ad-banners',
  '/api/themes',
];

function toUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function warm(path, run) {
  const startedAt = Date.now();
  const response = await fetch(toUrl(path), {
    headers: {
      'User-Agent': `massage-launch-prewarm/${run}`,
    },
  });
  const text = await response.text();
  return {
    path,
    run,
    status: response.status,
    ms: Date.now() - startedAt,
    bytes: text.length,
    cache: response.headers.get('x-vercel-cache') ?? 'n/a',
  };
}

const results = [];
for (let run = 0; run < 2; run += 1) {
  for (const path of paths) {
    results.push(await warm(path, run));
  }
}

const failed = results.filter((result) => result.status >= 400);
console.table(results.map(({ path, run, status, ms, cache }) => ({ run, status, ms, cache, path })));
if (failed.length > 0) {
  console.error(JSON.stringify({ baseUrl, failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ baseUrl, warmed: results.length }, null, 2));
