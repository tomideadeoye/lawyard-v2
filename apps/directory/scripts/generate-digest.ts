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
    const author: any = a.author;
    const authorName = Array.isArray(author) ? author[0]?.full_name : author?.full_name;
    console.log(`- ${a.title} by ${authorName || 'Expert'}`);
    console.log(`  Read more: https://directory.lawyard.org/knowledge/${a.slug}`);
  });

  console.log('\nNEW PODCASTS:');
  podcasts?.forEach(p => {
    const author: any = p.author;
    const authorName = Array.isArray(author) ? author[0]?.full_name : author?.full_name;
    console.log(`- [${p.media_type.toUpperCase()}] ${p.title} by ${authorName || 'Expert'}`);
    console.log(`  Listen/Watch: https://directory.lawyard.org/knowledge/${p.slug}`);
  });
}

generateWeeklyDigest();