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
const AUTH_LOGIN_IP_LIMIT = 30;
const AUTH_LOGIN_CREDENTIAL_LIMIT = 5;
const AUTH_LOGIN_WINDOW_MS = 10 * 60_000;
const TOO_MANY_REQUESTS_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';

type AuthRateLimitOptions = {
  credential?: string;
};

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
  let nextSweepAt = 0;

  function sweepExpiredBuckets(currentTime: number) {
    if (currentTime < nextSweepAt) {
      return;
    }

    nextSweepAt = currentTime + windowMs;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= currentTime) {
        buckets.delete(key);
      }
    }
  }

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
      sweepExpiredBuckets(currentTime);
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
const authLoginIpRateLimiter = createMemoryRateLimiter({
  limit: AUTH_LOGIN_IP_LIMIT,
  windowMs: AUTH_LOGIN_WINDOW_MS,
});
const authLoginCredentialRateLimiter = createMemoryRateLimiter({
  limit: AUTH_LOGIN_CREDENTIAL_LIMIT,
  windowMs: AUTH_LOGIN_WINDOW_MS,
});

function normalizeCredential(credential: string) {
  return credential.trim().toLowerCase();
}

export function buildAuthRateLimitKey(
  request: Pick<Request, 'headers'>,
  routeKey: string,
  options: AuthRateLimitOptions = {},
) {
  const keyParts = [routeKey, getClientIp(request)];
  const normalizedCredential = options.credential ? normalizeCredential(options.credential) : '';

  if (normalizedCredential) {
    keyParts.push(normalizedCredential);
  }

  return keyParts.join(':');
}

export function checkAuthRateLimit(
  request: Pick<Request, 'headers'>,
  routeKey: string,
  options: AuthRateLimitOptions = {},
) {
  if (routeKey === 'auth:login:ip') {
    return authLoginIpRateLimiter.check(buildAuthRateLimitKey(request, routeKey));
  }

  if (routeKey === 'auth:login:credential') {
    return authLoginCredentialRateLimiter.check(buildAuthRateLimitKey(request, routeKey, options));
  }

  return authRateLimiter.check(buildAuthRateLimitKey(request, routeKey, options));
}

export function applyRateLimitHeaders(response: Response, headers: Headers) {
  const mergedHeaders = new Headers(response.headers);
  headers.forEach((value, key) => {
    mergedHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: mergedHeaders,
  });
}