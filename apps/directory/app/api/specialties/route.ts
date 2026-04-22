import { NextResponse } from 'next/server';
import { getSpecialties } from '../../../lib/api';

export async function GET() {
  try {
    const specialties = await getSpecialties();
    return NextResponse.json(specialties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
