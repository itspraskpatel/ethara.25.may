import { NextResponse } from 'next/server';

export type ApiErrorCode = 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'NOT_FOUND';

export function okResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}
