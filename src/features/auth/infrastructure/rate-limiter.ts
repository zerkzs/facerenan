const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    return { allowed: true, retryAfterMs: 0 };
  }

  const elapsed = now - record.firstAttempt;
  if (elapsed > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - elapsed;
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  record.count += 1;
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
