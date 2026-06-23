const TRANSIENT_DATABASE_ERROR_PATTERNS = [
  'emaxconnsession',
  'max clients reached',
  'too many clients already',
  'remaining connection slots are reserved',
  'timeout exceeded when trying to connect',
  'timed out fetching a new connection from the connection pool',
  'connection terminated unexpectedly',
  'connection closed',
  'connection error',
  'econnreset',
  'econnrefused',
  'etimedout',
  'fetch failed',
  'p1001',
  'p2024',
  'p2037',
  "can't reach database server",
  'too many database connections opened',
] as const;

const MAX_RETRY_LOG_FRAGMENTS = 3;
const MAX_RETRY_LOG_FRAGMENT_LENGTH = 160;

function collectErrorFragments(error: unknown, seen = new Set<unknown>(), depth = 0): string[] {
  if (error == null || depth > 4 || seen.has(error)) {
    return [];
  }

  if (typeof error === 'string') {
    return [error];
  }

  if (typeof error !== 'object') {
    return [];
  }

  seen.add(error);

  if (error instanceof Error) {
    return [
      error.name,
      error.message,
      ...collectErrorFragments((error as Error & { cause?: unknown }).cause, seen, depth + 1),
    ].filter(Boolean);
  }

  const record = error as Record<string, unknown>;
  return [
    typeof record.name === 'string' ? record.name : '',
    typeof record.message === 'string' ? record.message : '',
    typeof record.code === 'string' ? record.code : '',
    ...collectErrorFragments(record.cause, seen, depth + 1),
    ...collectErrorFragments(record.meta, seen, depth + 1),
  ].filter(Boolean);
}

export function isTransientDatabaseError(error: unknown) {
  const haystack = collectErrorFragments(error).join('\n').toLowerCase();
  return TRANSIENT_DATABASE_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern));
}

export function summarizeDatabaseError(error: unknown) {
  const fragments = collectErrorFragments(error)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
    .slice(0, MAX_RETRY_LOG_FRAGMENTS)
    .map((fragment) =>
      fragment.length > MAX_RETRY_LOG_FRAGMENT_LENGTH
        ? `${fragment.slice(0, MAX_RETRY_LOG_FRAGMENT_LENGTH - 1)}…`
        : fragment,
    );

  return fragments.join(' | ') || 'unknown database error';
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 3, label = 'database operation') {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const transient = isTransientDatabaseError(error);
      if (!transient) {
        break;
      }

      const delayMs = 120 * (attempt + 1);
      const summary = summarizeDatabaseError(error);
      if (attempt === attempts - 1) {
        console.error(`[db] ${label} failed after ${attempts} attempts: ${summary}`);
        break;
      }

      console.warn(`[db] ${label} transient failure on attempt ${attempt + 1}/${attempts}; retrying in ${delayMs}ms: ${summary}`);
      await wait(delayMs);
    }
  }

  throw lastError;
}