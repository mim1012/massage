export type PageViewPayload = {
  path: string;
  referrer?: string;
};

const TRACKED_PREFIXES = ['/', '/shop/', '/board', '/top100', '/auth'];
const IGNORED_PREFIXES = ['/api', '/admin', '/_next', '/favicon'];

export function shouldTrackPath(path: string) {
  if (!path.startsWith('/')) {
    return false;
  }

  if (IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  return TRACKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}
