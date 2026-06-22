const TRANSIENT_DATABASE_ERROR_PATTERNS = [
  'EMAXCONNSESSION',
  'max clients reached',
  'too many clients already',
  'remaining connection slots are reserved',
  'timeout exceeded when trying to connect',
  'Connection terminated unexpectedly',
  'Connection closed',
  'Connection error',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'fetch failed',
  'P1001',
  'Can\'t reach database server',
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : '';
}

export function isTransientDatabaseError(error: unknown) {
  const message = getErrorMessage(error);
  return TRANSIENT_DATABASE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === attempts - 1) {
        break;
      }

      await wait(120 * (attempt + 1));
    }
  }

  throw lastError;
}
