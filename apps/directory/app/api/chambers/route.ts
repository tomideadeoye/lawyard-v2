import { NextResponse } from 'next/server';
import CHAMBERS from '../../../data/chambers.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');

  let data = [...CHAMBERS];

  if (featured === 'true') {
    data = data.filter(c => c.featured);
  }

  return NextResponse.json(data);
}
