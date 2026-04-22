import { NextResponse } from 'next/server';
import { getLawyers } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';
  const specialty = searchParams.get('specialty') || undefined;

  try {
    const lawyers = await getLawyers({ featured, specialty });
    return NextResponse.json(lawyers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
