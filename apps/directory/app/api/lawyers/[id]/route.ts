import { NextResponse } from 'next/server';
import LAWYERS from '../../../../data/lawyers.json';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = LAWYERS.find(l => l.id === params.id);

  if (!lawyer) {
    return NextResponse.json({ error: 'Lawyer not found' }, { status: 404 });
  }

  return NextResponse.json(lawyer);
}
