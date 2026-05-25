import { NextRequest } from 'next/server';

import prisma from '@/db/client/prismaClient';
import { visitorSchema } from '@/features/whiteboard/schema';
import { errorResponse, okResponse } from '@/lib/server/api-response';
import { getClientIp } from '@/lib/server/ip';
import { logServerEvent } from '@/lib/server/logger';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

void logServerEvent('init', 'whiteboard_visitor_api_initialized');

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const rateLimit = checkRateLimit(`visitor:${ipAddress}`, 30, 60_000);

  if (!rateLimit.allowed) {
    await logServerEvent('warn', 'whiteboard_visitor_rate_limited', { ipAddress });
    return errorResponse(429, 'RATE_LIMITED', 'Too many requests. Please wait a minute and try again.');
  }

  try {
    const body = await request.json();
    const parsed = visitorSchema.safeParse(body);

    if (!parsed.success) {
      await logServerEvent('warn', 'whiteboard_visitor_validation_failed', {
        ipAddress,
        issues: parsed.error.flatten(),
      });

      return errorResponse(400, 'VALIDATION_ERROR', 'Please check the submitted fields.', parsed.error.flatten());
    }

    const payload = parsed.data;

    const board = await prisma.whiteboardBoard.upsert({
      where: { slug: payload.boardSlug },
      create: { slug: payload.boardSlug },
      update: {},
      select: { id: true, slug: true },
    });

    const visitor = await prisma.whiteboardVisitor.upsert({
      where: {
        boardId_browserId: {
          boardId: board.id,
          browserId: payload.browserId,
        },
      },
      create: {
        boardId: board.id,
        browserId: payload.browserId,
        ipAddress,
        displayName: payload.displayName,
        email: payload.email ?? null,
      },
      update: {
        ipAddress,
        displayName: payload.displayName,
        email: payload.email ?? null,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
        lastSeenAt: true,
      },
    });

    await logServerEvent('info', 'whiteboard_visitor_registered', {
      boardSlug: board.slug,
      visitorId: visitor.id,
      ipAddress,
    });

    return okResponse(
      {
        boardSlug: board.slug,
        visitor,
      },
      201,
    );
  } catch (error) {
    await logServerEvent('error', 'whiteboard_visitor_registration_failed', {
      ipAddress,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return errorResponse(500, 'SERVER_ERROR', 'We could not register this board visit right now.');
  }
}
