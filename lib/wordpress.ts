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

async function wpPatch(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(`${WP_API}/${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${AUTH}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(`WordPress API error (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return res.json();
}

export async function updateWordPressPostStatus(postId: number, status: string) {
  return wpPatch(`posts/${postId}`, { status });
}

async function uploadImage(imageUrl: string): Promise<number | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok || !response.body) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = imageUrl.split('/').pop() || 'image.jpg';
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    const res = await fetch(`${WP_API}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: buffer,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WordPress media upload failed:', err);
      return null;
    }

    const media = await res.json();
    return media.id;
  } catch (e) {
    console.error('WordPress media upload error:', e);
    return null;
  }
}

async function ensureTag(name: string): Promise<number | null> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const search = await fetch(`${WP_API}/tags?slug=${slug}`, {
      headers: { 'Authorization': `Basic ${AUTH}` },
    })
    const existing = await search.json()
    if (Array.isArray(existing) && existing.length > 0) return existing[0].id

    const created = await fetch(`${WP_API}/tags`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    const tag = await created.json()
    return tag?.id ?? null
  } catch (e) {
    console.error('WordPress tag error:', e)
    return null
  }
}

async function publishPostWithImage(params: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
  meta: Record<string, string>;
  categories?: number[];
  tags?: string[];
  author?: number;
}) {
  const wpData: Record<string, unknown> = {
    title: params.title,
    content: params.content,
    excerpt: params.excerpt,
    status: params.status || 'draft',
    meta: params.meta,
  };
  if (params.date_gmt) wpData.date_gmt = params.date_gmt;
  if (params.categories) wpData.categories = params.categories;
  if (params.author) wpData.author = params.author;
  if (params.featured_image) {
    const mediaId = await uploadImage(params.featured_image);
    if (mediaId) wpData.featured_media = mediaId;
  }
  if (params.tags && params.tags.length > 0) {
    const ids = (await Promise.all(params.tags.map(t => ensureTag(t)))).filter(Boolean) as number[]
    if (ids.length > 0) wpData.tags = ids
  }
  return wpPost('posts', wpData);
}

export async function publishArticleToWordPress(article: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
}) {
  return publishPostWithImage({
    ...article,
    meta: { source: 'lawyard-v2-directory' },
  });
}

export async function publishPodcastToWordPress(podcast: {
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
  authorName?: string | null;
}) {
  const embedHtml = podcast.media_type === 'video'
    ? `<figure class="wp-block-embed is-type-video"><div class="wp-block-embed__wrapper"><iframe src="${podcast.media_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe></div></figure>`
    : `<figure class="wp-block-audio"><audio controls src="${podcast.media_url}"></audio></figure>`

  const content = `${embedHtml}\n\n${podcast.description}`
  return publishPostWithImage({
    title: podcast.title,
    content,
    excerpt: podcast.description.substring(0, 160),
    status: podcast.status || 'draft',
    date_gmt: podcast.date_gmt,
    author: 4,
    categories: [22],
    tags: ['podcast', ...(podcast.authorName ? [podcast.authorName] : [])],
    meta: { source: 'lawyard-v2-podcast', media_type: podcast.media_type, media_url: podcast.media_url },
  });
}

export async function publishCorporatePostToWordPress(submission: {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string | null;
  status?: 'draft' | 'publish' | 'future';
  date_gmt?: string;
  brand_name?: string | null;
  tier?: string | null;
  contact_email?: string | null;
  submitter_name?: string | null;
}) {
  return publishPostWithImage({
    title: submission.title,
    content: submission.content,
    excerpt: submission.excerpt,
    featured_image: submission.featured_image,
    status: submission.status || 'draft',
    date_gmt: submission.date_gmt,
    author: 4,
    categories: [7358],
    tags: ['corporate-posts', ...(submission.brand_name ? [submission.brand_name] : []), ...(submission.tier ? [submission.tier] : [])],
    meta: {
      source: 'lawyard-v2-corporate-posts',
      ...(submission.brand_name ? { brand_name: submission.brand_name } : {}),
      ...(submission.tier ? { tier: submission.tier } : {}),
      ...(submission.contact_email ? { contact_email: submission.contact_email } : {}),
      ...(submission.submitter_name ? { author_name: submission.submitter_name } : {}),
    },
  });
}
