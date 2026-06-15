import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at', envPath)
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase URL or Service Role Key is missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const TV_VIDEOS = [
  {
    title: 'Discuss NLS | Introductory Tips for the Nigerian Law school',
    slug: 'discuss-nls-introductory-tips-for-the-nigerian-law-school',
    description: 'This is the first video of Discuss NLS containing some essential tips for the Nigerian law school students.',
    media_url: 'https://www.youtube.com/watch?v=aSn9Lg4-KGM',
    media_type: 'video',
    status: 'published',
    created_at: '2018-12-12T00:00:00Z',
  },
  {
    title: 'Starting class late in Nigerian law school should not discourage you, it should motivate you',
    slug: 'starting-class-late-in-nigerian-law-school-should-not-discourage-you-it-should-motivate-you',
    description: 'My reply to messages i received from students who started classes a little later than others. Late admission into the Nigerian law school can be frustrating but it does not mean you wont do well, it all depends on how focused you are.',
    media_url: 'https://www.youtube.com/watch?v=OafyvHzFsRU',
    media_type: 'video',
    status: 'published',
    created_at: '2019-01-09T00:00:00Z',
  },
  {
    title: 'What to do about challenges, not just for law school students',
    slug: 'what-to-do-about-challenges-not-just-for-law-school-students',
    description: 'What to do about challenges in law school and beyond.',
    media_url: 'https://www.youtube.com/watch?v=uyUUYx1fNOk',
    media_type: 'video',
    status: 'published',
    created_at: '2019-02-17T00:00:00Z',
  },
  {
    title: 'The Lawyard Discourse on Energy in Nigeria',
    slug: 'the-lawyard-discourse-on-energy-in-nigeria',
    description: 'Discourse on the state and challenges of energy in Nigeria.',
    media_url: 'https://www.youtube.com/watch?v=WKuCG0Hvoqo',
    media_type: 'video',
    status: 'published',
    created_at: '2019-03-05T00:00:00Z',
  },
  {
    title: 'Lawyard Dialogue on Democracy with Prof Kingsley Moghalu 1',
    slug: 'lawyard-dialogue-on-democracy-with-prof-kingsley-moghalu-1',
    description: 'Dialogue on democracy, governance, and politics with Prof Kingsley Moghalu.',
    media_url: 'https://www.youtube.com/watch?v=ZOyJSWZbgsY',
    media_type: 'video',
    status: 'published',
    created_at: '2019-06-25T00:00:00Z',
  },
  {
    title: 'Lawyard Dialogue on Democracy with Prof Kingsley Moghalu 2',
    slug: 'lawyard-dialogue-on-democracy-with-prof-kingsley-moghalu-2',
    description: 'Part 2 of the Dialogue on democracy, governance, and politics with Prof Kingsley Moghalu.',
    media_url: 'https://www.youtube.com/watch?v=f5BVzLArVP8',
    media_type: 'video',
    status: 'published',
    created_at: '2019-06-27T00:00:00Z',
  },
  {
    title: 'First Panel Session of Lawyard Symposium on Privacy and Data Protection',
    slug: 'first-panel-session-of-lawyard-symposium-on-privacy-and-data-protection',
    description: 'First panel discussion at the Lawyard Symposium on Privacy and Data Protection.',
    media_url: 'https://www.youtube.com/watch?v=AtDDJT0tqHg',
    media_type: 'video',
    status: 'published',
    created_at: '2019-11-20T00:00:00Z',
  },
  {
    title: 'Second Panel Session at the Lawyard Symposium on Privacy and Data Protection',
    slug: 'second-panel-session-at-the-lawyard-symposium-on-privacy-and-data-protection',
    description: 'Second panel discussion at the Lawyard Symposium on Privacy and Data Protection.',
    media_url: 'https://www.youtube.com/watch?v=RueTdi43SzU',
    media_type: 'video',
    status: 'published',
    created_at: '2019-11-21T00:00:00Z',
  },
  {
    title: "Lawyard Dialogue Mapping Africa's Road to Prosperity",
    slug: 'lawyard-dialogue-mapping-africas-road-to-prosperity',
    description: 'Dialogue mapping out the road to prosperity and economic growth in Africa.',
    media_url: 'https://www.youtube.com/watch?v=cS62w7r2aC0',
    media_type: 'video',
    status: 'published',
    created_at: '2020-06-22T00:00:00Z',
  },
  {
    title: 'How to Get Verified to Vote in the NBA Elections',
    slug: 'how-to-get-verified-to-vote-in-the-nba-elections',
    description: 'A video tutorial explaining how to get verified to vote in the Nigerian Bar Association (NBA) elections.',
    media_url: 'https://www.lawyard.ng/wp-content/uploads/2020/07/VID-20200723-WA0046.mp4',
    media_type: 'video',
    status: 'published',
    created_at: '2020-07-23T00:00:00Z',
  },
]

async function run() {
  console.log('Fetching profiles to associate as author...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .limit(10)

  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    process.exit(1)
  }

  // Find admin profile if exists, otherwise fallback to first profile
  const admin = profiles.find((p) => p.role === 'admin') || profiles[0]
  if (!admin) {
    console.error('No profiles found in the database. Please seed or sign up a user first.')
    process.exit(1)
  }
  console.log(`Using Profile ID: ${admin.id} (${admin.role}) as author.`)

  for (const video of TV_VIDEOS) {
    console.log(`Ingesting: "${video.title}"...`)
    const { error } = await supabase.from('podcasts').upsert(
      {
        ...video,
        author_id: admin.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )

    if (error) {
      console.error(`Failed to ingest "${video.title}":`, error)
    } else {
      console.log(`Successfully migrated: "${video.title}"`)
    }
  }

  console.log('Migration completed!')
}

run()
