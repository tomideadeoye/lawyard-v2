import { NextResponse } from 'next/server';
import { getChambers } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';

  try {
    const chambers = await getChambers({ featured });
    return NextResponse.json(chambers);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
