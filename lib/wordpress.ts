'use server';

const WP_API = process.env.WP_API_URL!;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD?.replace(/\s/g, '')}`
).toString('base64');

async function wpPost(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(`${WP_API}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${AUTH}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`WordPress API error (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

export async function publishArticleToWordPress(article: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
}) {
  const result = await wpPost('posts', {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    status: article.status || 'draft',
    ...(article.date_gmt ? { date_gmt: article.date_gmt } : {}),
    meta: { source: 'lawyard-v2-directory' },
  });
  return result;
}

export async function publishCorporatePostToWordPress(submission: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
}) {
  const result = await wpPost('posts', {
    title: submission.title,
    content: submission.content,
    excerpt: submission.excerpt,
    status: submission.status || 'draft',
    ...(submission.date_gmt ? { date_gmt: submission.date_gmt } : {}),
    categories: [], 
    tags: ['corporate-posts'],
    meta: { source: 'lawyard-v2-corporate-posts' },
  });
  return result;
}
