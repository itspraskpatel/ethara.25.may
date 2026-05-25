import 'server-only';

import type { NextRequest } from 'next/server';

const FALLBACK_IP = '0.0.0.0';

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');

  return (
    forwardedFor?.split(',')[0]?.trim() ||
    vercelForwardedFor?.split(',')[0]?.trim() ||
    realIp?.trim() ||
    FALLBACK_IP
  );
}
