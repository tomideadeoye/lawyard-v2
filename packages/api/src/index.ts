import { z } from "zod";

/**
 * Lawyard 2.0 Core Data Schemas
 */

export const ArticleSchema = z.object({
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  author_id: z.number().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_media: z.number().optional(), // WP Media ID
  status: z.enum(["publish", "draft", "pending", "private"]).default("draft"),
});

export type Article = z.infer<typeof ArticleSchema>;

export const PodcastSchema = ArticleSchema.extend({
  audio_url: z.string().url(),
  duration: z.string().optional(),
});

export type Podcast = z.infer<typeof PodcastSchema>;

/**
 * Lawyard API Client
 * NextJS Control Plane -> WordPress REST API
 */
export class LawyardClient {
  private baseUrl: string;
  private authHeader?: string;

  constructor(config: { baseUrl: string; username?: string; password?: string }) {
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl;
    
    if (config.username && config.password) {
      // Basic Auth for WP REST API (Application Passwords)
      const token = Buffer.from(`${config.username}:${config.password}`).toString("base64");
      this.authHeader = `Basic ${token}`;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(this.authHeader ? { Authorization: this.authHeader } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Lawyard API error [${response.status}]: ${error.message}`);
    }
    
    return response.json();
  }

  /**
   * Article Management
   */
  async getArticles(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/wp-json/wp/v2/posts?${query}`);
  }

  async createArticle(article: Article) {
    return this.request("/wp-json/wp/v2/posts", {
      method: "POST",
      body: JSON.stringify(article),
    });
  }

  /**
   * Podcast Management (Requires Custom Post Type in WP)
   */
  async createPodcast(podcast: Podcast) {
    // Assuming 'podcasts' is the CPT slug
    return this.request("/wp-json/wp/v2/podcasts", {
      method: "POST",
      body: JSON.stringify(podcast),
    });
  }

  /**
   * Media Upload
   */
  async uploadMedia(file: Buffer, fileName: string, mimeType: string) {
    const headers = {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": mimeType,
    };

    return this.request("/wp-json/wp/v2/media", {
      method: "POST",
      body: file,
      headers,
    });
  }
}
