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
  return res.json();
}

export async function publishArticleToWordPress(article: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish';
}) {
  const result = await wpPost('posts', {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    status: article.status || 'draft',
    meta: { source: 'lawyard-v2-directory' },
  });
  return result;
}

export async function publishBrandPressToWordPress(submission: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish';
}) {
  const result = await wpPost('posts', {
    title: submission.title,
    content: submission.content,
    excerpt: submission.excerpt,
    status: submission.status || 'draft',
    categories: [], 
    tags: ['brand-press'],
    meta: { source: 'lawyard-v2-brand-press' },
  });
  return result;
}
