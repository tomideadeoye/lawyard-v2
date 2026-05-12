import { z } from "zod";

/**
 * Lawyard 2.0 Native Content Schemas (Supabase-ready)
 */

export const ArticleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(5, "Title is too short"),
  slug: z.string().min(3),
  content: z.string().min(50, "Content is too short"),
  excerpt: z.string().optional(),
  featured_image: z.string().url().optional().nullable(),
  author_id: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  created_at: z.string().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;

export const PodcastSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(5),
  slug: z.string().min(3),
  description: z.string().optional(),
  media_url: z.string().url(),
  media_type: z.enum(["audio", "video"]).default("audio"),
  duration: z.string().optional(),
  author_id: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  created_at: z.string().optional(),
});

export type Podcast = z.infer<typeof PodcastSchema>;

/**
 * Newsletter Subscription Schema
 */
export const NewsletterSubscriptionSchema = z.object({
  email: z.string().email(),
  subscribed_at: z.string().optional(),
});

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;