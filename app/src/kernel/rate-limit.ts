interface Window {
  started: number;
  count: number;
}

const windows = new Map<string, Window>();

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Janela fixa em memória; uma instância. Limpeza preguiçosa. */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateResult {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.started >= windowSeconds * 1000) {
    windows.set(key, { started: now, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count++;
  if (current.count <= limit) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((current.started + windowSeconds * 1000 - now) / 1000),
    ),
  };
}

export function sweepRateLimits(maxAgeSeconds = 3600): void {
  const cutoff = Date.now() - maxAgeSeconds * 1000;
  for (const [key, value] of windows) {
    if (value.started < cutoff) windows.delete(key);
  }
}
