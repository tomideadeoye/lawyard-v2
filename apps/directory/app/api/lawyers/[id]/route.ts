import { NextResponse } from 'next/server';
import LAWYERS from '../../../../data/lawyers.json';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lawyer = LAWYERS.find(l => l.id === id);

  if (!lawyer) {
    return NextResponse.json({ error: 'Lawyer not found' }, { status: 404 });
  }

  return NextResponse.json(lawyer);
}
