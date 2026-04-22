import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper: convert "8+ Years" experience string → array for DB
function normalizeExperience(exp: unknown): string[] {
  if (!exp) return []
  if (Array.isArray(exp)) return exp
  return [exp as string]
}

// Helper: convert specialty name → slug id
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function migrate() {
  console.log('🚀 Starting migration...')

  // 1. Load Data
  const specialtiesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/specialties.json'), 'utf8'))
  const chambers = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/chambers.json'), 'utf8'))
  const lawyers = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/lawyers.json'), 'utf8'))

  // Normalize specialties — JSON is an array of plain strings
  const specialties = specialtiesRaw.map((s: unknown) => {
    if (typeof s === 'string') {
      return { id: toSlug(s), name: s, slug: toSlug(s) }
    }
    // Already an object
    const obj = s as { id?: string; name?: string }
    const id = obj.id ?? toSlug(obj.name ?? '')
    return { id, name: obj.name ?? id, slug: id }
  })

  // 2. Insert Specialties
  console.log(`✨ Migrating ${specialties.length} Specialties...`)
  for (const spec of specialties) {
    const { error } = await supabase
      .from('specialties')
      .upsert({ id: spec.id, name: spec.name, slug: spec.slug })
    if (error) console.error(`  ❌ Specialty "${spec.name}":`, error.message)
    else console.log(`  ✅ Specialty: ${spec.name}`)
  }

  // 3. Insert Chambers
  console.log(`✨ Migrating ${chambers.length} Chambers...`)
  const chamberMap = new Map<string, string>()
  for (const chamber of chambers) {
    const { data, error } = await supabase
      .from('chambers')
      .upsert({
        name: chamber.name,
        location: chamber.location,
        focus: chamber.focus,
        image_url: chamber.image,
      })
      .select()
      .single()

    if (error) {
      console.error(`  ❌ Chamber "${chamber.name}":`, error.message)
    } else {
      chamberMap.set(chamber.id, data.id)
      console.log(`  ✅ Chamber: ${chamber.name}`)
    }
  }

  // Build a specialty name→id map for linking
  const specialtyNameMap = new Map(specialties.map((s: { id: string; name: string; slug: string }) => [s.name, s.id]))

  // 4. Insert Lawyers
  console.log(`✨ Migrating ${lawyers.length} Lawyers...`)
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
        email: lawyer.contact?.email ?? null,
        phone: lawyer.contact?.phone ?? null,
        website: lawyer.contact?.website ?? null,
        chamber_id: lawyer.chamberId ? chamberMap.get(lawyer.chamberId) ?? null : null,
        is_featured: lawyer.featured ?? false,
        education: Array.isArray(lawyer.education) ? lawyer.education : [],
        experience: normalizeExperience(lawyer.experience),
        achievements: Array.isArray(lawyer.achievements) ? lawyer.achievements : [],
      })
      .select()
      .single()

    if (lError) {
      console.error(`  ❌ Lawyer "${lawyer.name}":`, lError.message)
      continue
    }
    console.log(`  ✅ Lawyer: ${lawyer.name}`)

    // 5. Link Specialties
    // Handle both: array of slugs ["energy-law"] OR array of names ["Energy Law"] OR single specialty string
    const specRefs: string[] = []
    if (lawyer.specialties && Array.isArray(lawyer.specialties)) {
      for (const s of lawyer.specialties) {
        // try as slug directly, else convert name → slug
        const slug = specialties.find((sp: { id: string }) => sp.id === s) ? s : toSlug(s)
        specRefs.push(slug)
      }
    } else if (lawyer.specialty) {
      specRefs.push(toSlug(lawyer.specialty))
    }

    if (specRefs.length > 0) {
      // Only link specialties that actually exist in the DB
      const validLinks = specRefs
        .filter((slug: string) => specialties.some((sp: { id: string }) => sp.id === slug))
        .map((slug: string) => ({
          lawyer_id: newLawyer.id,
          specialty_id: slug,
        }))

      if (validLinks.length > 0) {
        const { error: sError } = await supabase
          .from('lawyer_specialties')
          .upsert(validLinks, { ignoreDuplicates: true })

        if (sError) console.error(`    ❌ Specialty links for ${lawyer.name}:`, sError.message)
        else console.log(`    ✅ Linked ${validLinks.length} specialties`)
      } else {
        console.log(`    ⚠️  No matching specialties to link for ${lawyer.name} — specialty "${lawyer.specialty}" not in canonical list`)
      }
    }
  }

  console.log('\n✅ Migration complete!')
}

migrate().catch(err => {
  console.error('Fatal Migration Error:', err)
  process.exit(1)
})
