import { NextResponse } from 'next/server';
import SPECIALTIES from '../../../data/specialties.json';

export async function GET() {
  return NextResponse.json(SPECIALTIES);
}
