import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image') as File

  if (!file || file.size === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > 500 * 1024) return NextResponse.json({ error: 'File is too large (max 500KB)' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filePath = `brand-press/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('brand-press')
    .upload(filePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('brand-press')
    .getPublicUrl(filePath)

  return NextResponse.json({ success: true, url: publicUrl })
}
