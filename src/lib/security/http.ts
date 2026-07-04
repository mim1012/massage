const SESSION_RESPONSE_CACHE_CONTROL = 'private, no-store, no-cache, max-age=0, must-revalidate';

type ContentSecurityPolicyOptions = {
  readonly allowDevelopmentEval: boolean;
  readonly scriptNonce?: string;
};

export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions) {
  const scriptSources = options.scriptNonce
    ? `script-src 'self' 'nonce-${options.scriptNonce}' 'strict-dynamic'${options.allowDevelopmentEval ? " 'unsafe-eval'" : ''}`
    : options.allowDevelopmentEval
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    scriptSources,
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: ws: wss:",
  ].join('; ');
}

const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy({
  allowDevelopmentEval: process.env.NODE_ENV !== 'production',
});

const BASELINE_SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  },
] as const;

export function applyNoStoreSessionHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('Cache-Control', SESSION_RESPONSE_CACHE_CONTROL);
  nextHeaders.set('Pragma', 'no-cache');
  nextHeaders.set('Expires', '0');
  nextHeaders.set('Vary', 'Cookie');
  return nextHeaders;
}

export function sessionJsonResponse(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: applyNoStoreSessionHeaders(init.headers),
  });
}

export function getBaselineSecurityHeaders() {
  return [...BASELINE_SECURITY_HEADERS];
}
