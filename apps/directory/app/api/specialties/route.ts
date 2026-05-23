import { NextResponse } from 'next/server';
import { getSpecialties } from '../../../lib/api';

export async function GET() {
  try {
    const specialties = await getSpecialties();
    return NextResponse.json(specialties);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
