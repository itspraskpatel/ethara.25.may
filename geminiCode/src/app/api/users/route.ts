import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { userSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimit(ip, 5, 60000)) {
      logger.warn('Rate limit exceeded', { ip });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const validatedData = userSchema.parse(body);

    const user = await prisma.user.create({
      data: {
        ipAddress: ip,
        name: validatedData.name,
        email: validatedData.email || null,
      },
    });

    logger.info('User created', { userId: user.id });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}