import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Load env variables manually for script
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Fallback to anon if service role isn't set yet

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
  console.log('🚀 Starting migration...')

  // 1. Load Data
  const specialties = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/specialties.json'), 'utf8'))
  const chambers = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/chambers.json'), 'utf8'))
  const lawyers = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/lawyers.json'), 'utf8'))

  // 2. Insert Specialties
  console.log('✨ Migrating Specialties...')
  for (const spec of specialties) {
    const { error } = await supabase
      .from('specialties')
      .upsert({ id: spec.id, name: spec.name, slug: spec.id })
    if (error) console.error(`Error inserting specialty ${spec.id}:`, error)
  }

  // 3. Insert Chambers
  console.log('✨ Migrating Chambers...')
  // We need to map old IDs to new UUIDs if we're not keeping the old ones
  // But for this seed, we'll keep the IDs as text if they are valid or generate new ones.
  // Actually, let's just use the names as a mapping key if IDs are not UUIDs.
  const chamberMap = new Map()
  for (const chamber of chambers) {
    const { data, error } = await supabase
      .from('chambers')
      .upsert({ 
        name: chamber.name, 
        location: chamber.location, 
        focus: chamber.focus, 
        image_url: chamber.image 
      })
      .select()
      .single()
    
    if (error) {
      console.error(`Error inserting chamber ${chamber.name}:`, error)
    } else {
      chamberMap.set(chamber.id, data.id)
    }
  }

  // 4. Insert Lawyers
  console.log('✨ Migrating Lawyers...')
  for (const lawyer of lawyers) {
    const { data: newLawyer, error: lError } = await supabase
      .from('lawyers')
      .upsert({
        name: lawyer.name,
        role: lawyer.role,
        location: lawyer.location,
        bio: lawyer.bio,
        image_url: lawyer.image,
        rating: lawyer.rating,
        reviews_count: lawyer.reviews,
        email: lawyer.contact?.email,
        phone: lawyer.contact?.phone,
        website: lawyer.contact?.website,
        chamber_id: chamberMap.get(lawyer.chamberId),
        is_featured: lawyer.featured,
        education: lawyer.education,
        experience: lawyer.experience,
        achievements: lawyer.achievements
      })
      .select()
      .single()

    if (lError) {
      console.error(`Error inserting lawyer ${lawyer.name}:`, lError)
      continue
    }

    // 5. Link Specialties
    if (lawyer.specialties && lawyer.specialties.length > 0) {
      const specialtyLinks = lawyer.specialties.map((specId: string) => ({
        lawyer_id: newLawyer.id,
        specialty_id: specId
      }))

      const { error: sError } = await supabase
        .from('lawyer_specialties')
        .insert(specialtyLinks)
      
      if (sError) console.error(`Error linking specialties for ${lawyer.name}:`, sError)
    }
  }

  console.log('✅ Migration complete!')
}

migrate().catch(err => {
  console.error('Fatal Migration Error:', err)
  process.exit(1)
})
