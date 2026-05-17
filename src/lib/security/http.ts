const SESSION_RESPONSE_CACHE_CONTROL = 'private, no-store, no-cache, max-age=0, must-revalidate';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "connect-src 'self' https: ws: wss:",
].join('; ');

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
  return [
    { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    },
  ];
}
