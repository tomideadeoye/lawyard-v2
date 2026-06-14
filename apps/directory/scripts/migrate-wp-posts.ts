/**
 * migrate-wp-posts.ts
 * -------------------
 * Migrates WordPress posts from a WP All Export CSV into Supabase articles
 * (and podcasts, for posts with a podcast media URL).
 *
 * Usage:
 *   npx tsx scripts/migrate-wp-posts.ts
 *
 * Env vars needed (via .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Design decisions:
 *   - Uses the service-role key to bypass RLS
 *   - Upserts on `slug` so re-runs are safe
 *   - Posts whose status is 'publish' → 'published'; draft → 'draft'; else → 'archived'
 *   - The article author_id is always the admin profile (ADMIN_PROFILE_ID)
 *     because WP author emails are not guaranteed to match Supabase profiles yet.
 *   - Posts where `enclosure` (podcast audio URL) exists are routed to `podcasts`
 *     AND also inserted as articles so content is searchable.
 *   - Rows with empty title AND empty content are skipped.
 *   - Dates that parse to 1970 fall back to Post Modified Date; if that also
 *     fails we use the current timestamp.
 *   - The first pipe-separated image URL becomes `featured_image`.
 *   - Categories are normalised: first category becomes the `category` field.
 *   - Slugs are derived from the WordPress Slug field; if blank, we use the WP ID.
 *   - Duplicate slugs within the CSV batch get a numeric suffix.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

// ─── Env ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ─── Config ──────────────────────────────────────────────────────────────────

/** Service-role profile ID used as author for every imported post */
const ADMIN_PROFILE_ID = '8251d905-5536-404f-9335-fbd5f34d3f44'

const CSV_PATH = path.join(__dirname, '../data/wp-posts.csv')
const BATCH_SIZE = 50          // rows to upsert in one Supabase call
const DRY_RUN   = false        // set true to parse & log without inserting

// ─── CSV Parser ──────────────────────────────────────────────────────────────

/**
 * Minimal but spec-compliant CSV parser.
 * Handles: quoted fields, embedded commas, embedded quotes (""), multiline fields, BOM.
 */
function parseCSVLine(line: string, more: () => string | null): { fields: string[]; extra: string } {
  const fields: string[] = []
  let i = 0
  while (i <= line.length) {
    if (line[i] === '"') {
      // quoted field
      let val = ''
      i++ // skip opening quote
      while (true) {
        if (i >= line.length) {
          // field spans multiple lines — fetch next line
          const next = more()
          if (next === null) break
          val += '\n'
          line = next
          i = 0
          continue
        }
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            val += '"'
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          val += line[i++]
        }
      }
      fields.push(val)
    } else {
      // unquoted field
      const start = i
      while (i < line.length && line[i] !== ',') i++
      fields.push(line.slice(start, i))
    }
    // skip comma separator
    if (line[i] === ',') i++
    else break
  }
  return { fields, extra: line.slice(i) }
}

/**
 * Parses the entire CSV file into an array of row-objects.
 * Returns headers as the first entry (for reference).
 */
async function* parseCSVFile(filePath: string): AsyncGenerator<Record<string, string>> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  const lineBuffer: string[] = []
  let resolved: (() => void) | null = null
  let done = false

  rl.on('line', (line) => {
    lineBuffer.push(line)
    if (resolved) { resolved(); resolved = null }
  })
  rl.on('close', () => {
    done = true
    if (resolved) { resolved(); resolved = null }
  })

  const nextLine = (): Promise<string | null> =>
    new Promise((res) => {
      if (lineBuffer.length > 0) return res(lineBuffer.shift()!)
      if (done) return res(null)
      resolved = () => res(lineBuffer.length > 0 ? lineBuffer.shift()! : null)
    })

  // Read header row (strip BOM if present)
  let headerLine = await nextLine()
  if (!headerLine) return
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1)

  let lineConsumed = headerLine
  let pendingBuffer: string[] = []

  // Build a synchronous "more()" supplier from our async buffer
  // We pre-fill synchronously by reading lines into pendingBuffer
  const headers = parseCSVRow(headerLine)

  let currentLine: string | null = await nextLine()

  while (currentLine !== null) {
    // Collect the row — may span multiple physical lines
    let rowLine = currentLine
    const rowFields: string[] = []
    let idx = 0

    // Simple synchronous multi-line parse using a pre-reader
    const pendingLines: string[] = []
    let syncMore: (() => string | null) = () => {
      return pendingLines.length > 0 ? pendingLines.shift()! : null
    }

    // We optimistically attempt parse; if the field count is low, we fetch more lines
    while (true) {
      const { fields } = parseCSVLine(rowLine, syncMore)
      // If we got all header fields, we're done
      if (fields.length >= headers.length) {
        const row: Record<string, string> = {}
        for (let h = 0; h < headers.length; h++) {
          row[headers[h]] = (fields[h] ?? '').trim()
        }
        yield row
        break
      } else {
        // Need another line (multiline field that exhausted pendingLines)
        const extra = await nextLine()
        if (extra === null) {
          // EOF mid-row — yield what we have
          const row: Record<string, string> = {}
          for (let h = 0; h < headers.length; h++) {
            row[headers[h]] = (fields[h] ?? '').trim()
          }
          yield row
          break
        }
        // Append to rowLine so parseCSVLine can continue
        pendingLines.push(extra)
        rowLine = rowLine + '\n' + extra
      }
    }

    currentLine = await nextLine()
  }
}

/** Parses a single CSV line into fields (no multiline support — for headers only) */
function parseCSVRow(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i <= line.length) {
    if (line[i] === '"') {
      let val = ''
      i++
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2 }
        else if (line[i] === '"') { i++; break }
        else val += line[i++]
      }
      fields.push(val)
    } else {
      const start = i
      while (i < line.length && line[i] !== ',') i++
      fields.push(line.slice(start, i))
    }
    if (line[i] === ',') i++
    else break
  }
  return fields
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapStatus(wpStatus: string): string {
  switch ((wpStatus || '').toLowerCase()) {
    case 'publish': return 'published'
    case 'draft':   return 'draft'
    default:        return 'archived'
  }
}

function parseDate(raw: string, fallback: string): string {
  if (!raw) return fallback || new Date().toISOString()
  const d = new Date(raw)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
    const fb = new Date(fallback)
    if (!isNaN(fb.getTime()) && fb.getFullYear() >= 2000) return fb.toISOString()
    return new Date().toISOString()
  }
  return d.toISOString()
}

/** Take the first of a pipe-separated list */
function firstOf(pipeValue: string): string {
  if (!pipeValue) return ''
  return pipeValue.split('|')[0]?.trim() ?? ''
}

/** Normalise category to a safe string; returns 'general' if empty */
function normaliseCategory(categories: string): string {
  const first = firstOf(categories)
  if (!first) return 'general'
  return first
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function migrate() {
  console.log('🚀  Starting WordPress → Supabase migration')
  console.log(`📂  CSV: ${CSV_PATH}`)
  console.log(`🔑  Admin profile ID: ${ADMIN_PROFILE_ID}`)
  console.log(`📦  Batch size: ${BATCH_SIZE}`)
  if (DRY_RUN) console.log('⚠️   DRY RUN — no data will be written')
  console.log('')

  // Verify the admin profile exists
  if (!DRY_RUN) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', ADMIN_PROFILE_ID)
      .single()
    if (pErr || !profile) {
      console.error('❌  Admin profile not found in Supabase. Check ADMIN_PROFILE_ID.')
      console.error(pErr?.message)
      process.exit(1)
    }
    console.log(`✅  Verified admin profile: ${profile.full_name}`)
  }

  let totalRows   = 0
  let skipped     = 0
  let articlesOk  = 0
  let articlesErr = 0
  let podcastsOk  = 0
  let podcastsErr = 0

  const slugsSeen = new Set<string>()

  const articleBatch: Record<string, unknown>[] = []
  const podcastBatch: Record<string, unknown>[] = []

  /** Flush articles batch to Supabase */
  async function flushArticles() {
    if (articleBatch.length === 0) return
    if (DRY_RUN) {
      console.log(`  [DRY] Would upsert ${articleBatch.length} articles`)
      articlesOk += articleBatch.length
      articleBatch.length = 0
      return
    }
    const { error } = await supabase
      .from('articles')
      .upsert(articleBatch, { onConflict: 'slug', ignoreDuplicates: false })
    if (error) {
      console.error(`  ❌  Article batch error:`, error.message)
      articlesErr += articleBatch.length
    } else {
      articlesOk += articleBatch.length
      process.stdout.write(`  ✅  Articles: ${articlesOk} inserted\r`)
    }
    articleBatch.length = 0
  }

  /** Flush podcasts batch to Supabase */
  async function flushPodcasts() {
    if (podcastBatch.length === 0) return
    if (DRY_RUN) {
      console.log(`  [DRY] Would upsert ${podcastBatch.length} podcasts`)
      podcastsOk += podcastBatch.length
      podcastBatch.length = 0
      return
    }
    const { error } = await supabase
      .from('podcasts')
      .upsert(podcastBatch, { onConflict: 'slug', ignoreDuplicates: false })
    if (error) {
      console.error(`  ❌  Podcast batch error:`, error.message)
      podcastsErr += podcastBatch.length
    } else {
      podcastsOk += podcastBatch.length
    }
    podcastBatch.length = 0
  }

  // ── Stream and process each row ──────────────────────────────────────────

  for await (const row of parseCSVFile(CSV_PATH)) {
    totalRows++

    const wpId      = row['id']       || ''
    const title     = row['Title']    || ''
    const content   = row['Content']  || ''
    const excerpt   = row['Excerpt']  || ''
    const dateRaw   = row['Date']     || ''
    const modRaw    = row['Post Modified Date'] || ''
    const permalink = row['Permalink']  || ''
    const imageUrl  = row['Image URL']  || ''
    const categories = row['Categories'] || ''
    const tags       = row['Tags']       || ''
    const metaDesc   = row['_yoast_wpseo_metadesc'] || ''
    const wpStatus   = row['Status']    || 'draft'
    const wpSlugRaw  = row['Slug']      || ''
    const enclosure  = row['enclosure'] || ''   // podcast media URL
    const postVideo  = row['post_video'] || ''

    // Skip empty rows
    if (!title.trim() && !content.trim()) {
      skipped++
      continue
    }

    // ── Slug ────────────────────────────────────────────────────────────────
    let slug = wpSlugRaw ? toSlug(wpSlugRaw) : (title ? toSlug(title) : `post-${wpId}`)
    if (!slug) slug = `post-${wpId}`

    // Deduplicate within this migration run
    if (slugsSeen.has(slug)) {
      let suffix = 2
      while (slugsSeen.has(`${slug}-${suffix}`)) suffix++
      slug = `${slug}-${suffix}`
    }
    slugsSeen.add(slug)

    // ── Dates ───────────────────────────────────────────────────────────────
    const createdAt = parseDate(dateRaw, modRaw)
    const updatedAt = parseDate(modRaw, dateRaw) || createdAt

    // ── Status ──────────────────────────────────────────────────────────────
    const status = mapStatus(wpStatus)

    // ── Featured image ──────────────────────────────────────────────────────
    const featuredImage = firstOf(imageUrl) || null

    // ── Category ────────────────────────────────────────────────────────────
    const category = normaliseCategory(categories)

    // ── Excerpt / meta ──────────────────────────────────────────────────────
    const excerptFinal = excerpt || metaDesc || ''

    // ── Article record ───────────────────────────────────────────────────────
    const articleRecord: Record<string, unknown> = {
      title:          title || `Untitled Post ${wpId}`,
      slug,
      content:        content || ' ', // content NOT NULL
      excerpt:        excerptFinal   || null,
      featured_image: featuredImage,
      author_id:      ADMIN_PROFILE_ID,
      status,
      category,
      article_type:   'editorial',
      created_at:     createdAt,
      updated_at:     updatedAt,
    }

    articleBatch.push(articleRecord)

    // ── Podcast routing ──────────────────────────────────────────────────────
    // If enclosure or post_video present, also add to podcasts table
    const mediaUrl = enclosure || postVideo
    if (mediaUrl) {
      const mediaType = postVideo ? 'video' : 'audio'
      podcastBatch.push({
        title:      title || `Untitled Podcast ${wpId}`,
        slug:       `podcast-${slug}`,
        description: excerptFinal || null,
        media_url:  mediaUrl,
        media_type: mediaType,
        author_id:  ADMIN_PROFILE_ID,
        status,
        created_at: createdAt,
        updated_at: updatedAt,
      })
    }

    // ── Flush batches ────────────────────────────────────────────────────────
    if (articleBatch.length >= BATCH_SIZE)  await flushArticles()
    if (podcastBatch.length >= BATCH_SIZE)  await flushPodcasts()

    // Progress indicator every 500 rows
    if (totalRows % 500 === 0) {
      process.stdout.write(`  📊  Processed ${totalRows.toLocaleString()} rows (${skipped} skipped)...\r`)
    }
  }

  // Flush remaining
  await flushArticles()
  await flushPodcasts()

  console.log('\n')
  console.log('═══════════════════════════════════════')
  console.log('  Migration Complete')
  console.log('═══════════════════════════════════════')
  console.log(`  Total CSV rows processed : ${totalRows.toLocaleString()}`)
  console.log(`  Skipped (empty)          : ${skipped.toLocaleString()}`)
  console.log(`  Articles inserted ✅     : ${articlesOk.toLocaleString()}`)
  console.log(`  Articles failed   ❌     : ${articlesErr.toLocaleString()}`)
  console.log(`  Podcasts inserted ✅     : ${podcastsOk.toLocaleString()}`)
  console.log(`  Podcasts failed   ❌     : ${podcastsErr.toLocaleString()}`)
  console.log('═══════════════════════════════════════')
}

migrate().catch((err) => {
  console.error('\n💥  Fatal error:', err)
  process.exit(1)
})
