import crypto from 'node:crypto';

export const ANALYTICS_SESSION_COOKIE_NAME = 'massage_analytics_session';

export function createAnalyticsSessionId() {
  return crypto.randomUUID();
}
