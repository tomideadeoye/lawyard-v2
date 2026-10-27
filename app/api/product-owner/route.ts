import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Token-gated write endpoint for the Product Owner board (no login).
// The token lives in PRODUCT_OWNER_TOKEN (server-side env only).
function tokenFrom(req: NextRequest): string | null {
  return req.headers.get('x-po-token') || new URL(req.url).searchParams.get('token')
}

export async function POST(req: NextRequest) {
  const token = tokenFrom(req)
  if (!token || !process.env.PRODUCT_OWNER_TOKEN || token !== process.env.PRODUCT_OWNER_TOKEN) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let payload: { action?: string; question_key?: string; answer_text?: string; answer_choice?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  if (payload.action === 'answer' && payload.question_key) {
    const { error } = await supabase
      .from('product_questions')
      .update({
        status: 'answered',
        answer_text: payload.answer_text || null,
        answer_choice: payload.answer_choice || null,
        answered_at: now,
      })
      .eq('question_key', payload.question_key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (payload.action === 'insight' && payload.answer_text?.trim()) {
    const { error } = await supabase.from('product_questions').insert({
      question_key: `insight-${now}`,
      title: 'Insight / idea (from Tobi)',
      body: payload.answer_text.trim().slice(0, 2000),
      status: 'insight',
      source: 'product-owner-board',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
