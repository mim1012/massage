type MemoryRateLimiterOptions = {
  limit?: number;
  windowMs?: number;
  now?: () => number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitCheckResult =
  | {
      limited: false;
      headers: Headers;
    }
  | {
      limited: true;
      response: Response;
    };

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60_000;
const TOO_MANY_REQUESTS_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';

export function getClientIp(request: Pick<Request, 'headers'>) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip');
  return realIp?.trim() || 'unknown';
}

export function createMemoryRateLimiter(options: MemoryRateLimiterOptions = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? (() => Date.now());
  const buckets = new Map<string, RateLimitBucket>();

  function buildHeaders(bucket: RateLimitBucket) {
    const remaining = Math.max(0, limit - bucket.count);
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store');
    headers.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now()) / 1000))));
    headers.set('X-RateLimit-Limit', String(limit));
    headers.set('X-RateLimit-Remaining', String(remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    return headers;
  }

  return {
    check(key: string): RateLimitCheckResult {
      const currentTime = now();
      const existingBucket = buckets.get(key);
      const bucket =
        !existingBucket || existingBucket.resetAt <= currentTime
          ? { count: 0, resetAt: currentTime + windowMs }
          : existingBucket;

      bucket.count += 1;
      buckets.set(key, bucket);

      if (bucket.count > limit) {
        return {
          limited: true,
          response: Response.json(
            { error: TOO_MANY_REQUESTS_MESSAGE },
            {
              status: 429,
              headers: buildHeaders(bucket),
            },
          ),
        };
      }

      return {
        limited: false,
        headers: buildHeaders(bucket),
      };
    },
    reset() {
      buckets.clear();
    },
  };
}

const authRateLimiter = createMemoryRateLimiter();

export function checkAuthRateLimit(request: Pick<Request, 'headers'>, routeKey: string) {
  return authRateLimiter.check(`${routeKey}:${getClientIp(request)}`);
}
