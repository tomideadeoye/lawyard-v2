'use server';

const WEBHOOKS = {
  legalUpdates: [
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_1,
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_2,
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_3,
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_4,
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_5,
    process.env.SLACK_WEBHOOK_LEGAL_UPDATES_6,
  ].filter(Boolean) as string[],
  newsletter: process.env.SLACK_WEBHOOK_NEWSLETTER,
  editorialInbox: process.env.SLACK_WEBHOOK_EDITORIAL_INBOX,
} as const;

export type SlackChannel = keyof typeof WEBHOOKS;

interface SlackMessage {
  text?: string;
  blocks?: Record<string, unknown>[];
  attachments?: Record<string, unknown>[];
}

async function postToSlack(channel: SlackChannel, message: SlackMessage): Promise<{ ok: boolean; error?: string }> {
  const webhook = 
    channel === 'newsletter' ? WEBHOOKS.newsletter :
    channel === 'editorialInbox' ? WEBHOOKS.editorialInbox :
    WEBHOOKS.legalUpdates[0];
  
  if (!webhook) {
    return { ok: false, error: `No webhook configured for ${channel}` };
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Slack error: ${res.status} ${text}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function postArticleToSlack(article: {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  categories: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const categoryTags = article.categories.map(c => `\`${c}\``).join(' ');
  
  return postToSlack('editorialInbox', {
    text: `📰 *New Article for Review*\n\n*${article.title}*\nBy ${article.authorName} ${categoryTags}\n\n${article.excerpt}\n\n🔗 ${process.env.NEXT_PUBLIC_SITE_URL}/knowledge/${article.slug}`,
  });
}

export async function postPodcastToSlack(podcast: {
  title: string;
  slug: string;
  description: string;
  mediaType: string;
  authorName: string;
  categories: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const categoryTags = podcast.categories.map(c => `\`${c}\``).join(' ');
  const icon = podcast.mediaType === 'video' ? '🎥' : '🎙️';
  
  return postToSlack('editorialInbox', {
    text: `${icon} *New Podcast for Review*\n\n*${podcast.title}*\nBy ${podcast.authorName} ${categoryTags}\n\n${podcast.description}\n\n🔗 ${process.env.NEXT_PUBLIC_SITE_URL}/knowledge/${podcast.slug}`,
  });
}

export async function postBrandPressToSlack(submission: {
  title: string;
  slug: string;
  brandName: string;
  excerpt: string;
}): Promise<{ ok: boolean; error?: string }> {
  return postToSlack('editorialInbox', {
    text: `📢 *New Brand Press Submission*\n\n*${submission.title}*\nBy ${submission.brandName}\n\n${submission.excerpt}\n\n🔗 ${process.env.NEXT_PUBLIC_SITE_URL}/brand-press/${submission.slug}`,
  });
}

const DIRECTORY_WEBHOOK = process.env.DIRECTORY_SLACK_WEBHOOK;
const DIRECTORY_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://directory.lawyard.org';

async function postToDirectorySlack(message: SlackMessage): Promise<{ ok: boolean; error?: string }> {
  if (!DIRECTORY_WEBHOOK) {
    return { ok: false, error: 'No DIRECTORY_SLACK_WEBHOOK configured' };
  }

  try {
    const res = await fetch(DIRECTORY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Slack error: ${res.status} ${text}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function postArticleToSlackWithButtons(article: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  categories: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const categoryTags = article.categories.map(c => `\`${c}\``).join(' ');
  const editorUrl = `${DIRECTORY_BASE_URL}/admin/pipeline`;

  return postToDirectorySlack({
    text: `📰 *New Article for Review*\n\n*${article.title}*\nBy ${article.authorName} ${categoryTags}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📰 New Article for Review', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${article.title}*\nBy ${article.authorName} ${categoryTags}\n\n${article.excerpt}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `ID: \`${article.id}\``,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve', emoji: true },
            style: 'primary',
            value: article.id,
            action_id: 'approve_article',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Deny', emoji: true },
            style: 'danger',
            value: article.id,
            action_id: 'deny_article',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '✏️ Open Editor', emoji: true },
            url: editorUrl,
            action_id: 'open_editor',
          },
        ],
      },
    ],
  });
}

export async function postBrandPressToSlackWithButtons(submission: {
  id: string;
  title: string;
  slug: string;
  brandName: string;
  excerpt: string;
  tier: string;
}): Promise<{ ok: boolean; error?: string }> {
  const editorUrl = `${DIRECTORY_BASE_URL}/admin/content?tab=brand-press`;

  return postToDirectorySlack({
    text: `📢 *New Brand Press for Review*\n\n*${submission.title}*\nBy ${submission.brandName} (${submission.tier})`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📢 New Brand Press for Review', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${submission.title}*\nBy *${submission.brandName}* · Tier: \`${submission.tier}\`\n\n${submission.excerpt}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `ID: \`${submission.id}\``,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve', emoji: true },
            style: 'primary',
            value: submission.id,
            action_id: 'approve_brand_press',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Deny', emoji: true },
            style: 'danger',
            value: submission.id,
            action_id: 'deny_brand_press',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '✏️ Open Editor', emoji: true },
            url: editorUrl,
            action_id: 'open_editor_bp',
          },
        ],
      },
    ],
  });
}

export async function postNewsToSlack(article: {
  title: string;
  url: string;
  source: string;
  excerpt?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const message: SlackMessage = {
    text: article.excerpt 
      ? `${article.title}\n${article.url}`
      : `${article.title}\n${article.url}`,
  };
  
  // Post to all legal_updates webhooks for redundancy
  const results = await Promise.all(
    WEBHOOKS.legalUpdates.map(webhook => 
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).then(r => r.ok).catch(() => false)
    )
  );
  
  return { ok: results.some(Boolean) };
}

export async function postLawyerVerificationToSlack(verification: {
  id: string;
  full_name: string;
  email: string;
  scn: string | null;
  year_of_call: number;
  phone: string | null;
  firm_name: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const adminUrl = `${DIRECTORY_BASE_URL}/admin/verifications`;

  const payload = [
    `*Name:* ${verification.full_name}`,
    `*Email:* ${verification.email}`,
    `*SCN:* ${verification.scn || '—'}`,
    `*Year of Call:* ${verification.year_of_call}`,
    `*Phone:* ${verification.phone || '—'}`,
    `*Firm:* ${verification.firm_name || '—'}`,
  ].join('\n');

  return postToDirectorySlack({
    text: `⚖️ *New Lawyer Verification Request*\n\n${payload}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚖️ New Lawyer Verification Request', emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: payload },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `ID: \`${verification.id}\`` }],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve', emoji: true },
            style: 'primary',
            value: verification.id,
            action_id: 'approve_lawyer',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Deny', emoji: true },
            style: 'danger',
            value: verification.id,
            action_id: 'deny_lawyer',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 View Dashboard', emoji: true },
            url: adminUrl,
            action_id: 'view_verifications',
          },
        ],
      },
    ],
  });
}
