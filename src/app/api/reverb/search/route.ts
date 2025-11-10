import { NextResponse } from 'next/server';

// Reverb integration has been removed. Keep a stub to avoid 404 churn.
export const runtime = 'edge';

export async function GET() {
  return new NextResponse(
    JSON.stringify({ error: 'Reverb API removed', message: 'This endpoint has been deprecated.' }),
    {
      status: 410,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
