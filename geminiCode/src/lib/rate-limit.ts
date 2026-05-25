const rateLimitCache = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(ip);

  if (!record) {
    rateLimitCache.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > windowMs) {
    rateLimitCache.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}