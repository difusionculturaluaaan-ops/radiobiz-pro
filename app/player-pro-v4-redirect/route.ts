import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('cid');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing cid parameter' },
      { status: 400 }
    );
  }

  return NextResponse.redirect(new URL(`/player/${clientId}`, request.url), 307);
}
