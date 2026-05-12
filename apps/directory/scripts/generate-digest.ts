import { createClient } from '../lib/supabase/server';

async function generateWeeklyDigest() {
  const supabase = await createClient();
  const lastFriday = new Date();
  lastFriday.setDate(lastFriday.getDate() - 7);

  const { data: articles } = await supabase
    .from('articles')
    .select('title, excerpt, slug, author:profiles(full_name)')
    .eq('status', 'published')
    .gte('created_at', lastFriday.toISOString());

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('title, description, slug, media_type, author:profiles(full_name)')
    .eq('status', 'published')
    .gte('created_at', lastFriday.toISOString());

  console.log('--- IN CASE YOU MISSED THIS: WEEKLY DIGEST ---');
  
  console.log('\nNEW ARTICLES:');
  articles?.forEach(a => {
    console.log(`- ${a.title} by ${a.author?.full_name || 'Expert'}`);
    console.log(`  Read more: https://directory.lawyard.org/knowledge/${a.slug}`);
  });

  console.log('\nNEW PODCASTS:');
  podcasts?.forEach(p => {
    console.log(`- [${p.media_type.toUpperCase()}] ${p.title} by ${p.author?.full_name || 'Expert'}`);
    console.log(`  Listen/Watch: https://directory.lawyard.org/knowledge/${p.slug}`);
  });
}

generateWeeklyDigest();