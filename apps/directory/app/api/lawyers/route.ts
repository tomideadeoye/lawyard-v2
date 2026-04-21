import { NextResponse } from 'next/server';
import LAWYERS from '../../../data/lawyers.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');
  const specialty = searchParams.get('specialty');

  let data = [...LAWYERS];

  if (featured === 'true') {
    data = data.filter(l => l.featured);
  }

  if (specialty) {
    data = data.filter(l => l.specialty.toLowerCase().includes(specialty.toLowerCase()));
  }

  // Simulate network latency for realism
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(data);
}
