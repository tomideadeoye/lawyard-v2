import { getAdminClient } from '@/lib/supabase/admin-auth';

export interface AdminStats {
  totalLawyers: number;
  verifiedLawyers: number;
  pendingLawyers: number;
  totalChambers: number;
  totalSubscribers: number;
  totalArticles: number;
  totalPodcasts: number;
}

export interface Lawyer {
  id: string;
  name: string;
  role: string;
  location: string;
  email: string | null;
  phone: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}

async function safeCount(builder: any): Promise<{ count: number | null; error?: any }> {
  try {
    const { count, error } = await builder;
    if (error) return { count: null, error };
    return { count };
  } catch (err: any) {
    return { count: null, error: { message: err?.message || String(err), code: 'UNCAUGHT' } };
  }
}

async function safeQuery<T>(
  label: string,
  builder: any
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await builder;
    if (error) {
      console.error(`Error fetching ${label}:`, { message: error.message, details: error.details, hint: error.hint, code: error.code });
      return { data: null, error: { message: error.message, code: error.code, details: error.details } };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error(`Error fetching ${label}:`, err);
    return { data: null, error: { message: err?.message || String(err), code: 'UNCAUGHT' } };
  }
}

export async function getAdminStats(): Promise<ApiResult<AdminStats>> {
  const { supabase } = await getAdminClient();

  const queries: Promise<{ count: number | null; error?: any }>[] = [
    safeCount(supabase.from('lawyers').select('*', { count: 'exact', head: true })),
    safeCount(supabase.from('lawyers').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')),
    safeCount(supabase.from('lawyers').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')),
    safeCount(supabase.from('chambers').select('*', { count: 'exact', head: true })),
    safeCount(supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true })),
    safeCount(supabase.from('articles').select('*', { count: 'exact', head: true })),
    safeCount(supabase.from('podcasts').select('*', { count: 'exact', head: true })),
  ];

  const keys: (keyof AdminStats)[] = ['totalLawyers', 'verifiedLawyers', 'pendingLawyers', 'totalChambers', 'totalSubscribers', 'totalArticles', 'totalPodcasts'];
  const stats = { totalLawyers: 0, verifiedLawyers: 0, pendingLawyers: 0, totalChambers: 0, totalSubscribers: 0, totalArticles: 0, totalPodcasts: 0 };
  let firstError: ApiError | null = null;

  const results = await Promise.allSettled(queries);
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (r.value.error && !firstError) firstError = r.value.error;
      if (r.value.count != null) {
        const key = keys[i] as keyof AdminStats;
        stats[key] = r.value.count;
      }
    }
  });

  return { data: stats, error: firstError };
}

export interface LawyerFull {
  id: string;
  name: string;
  role: string;
  location: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  specialties: { name: string }[] | null;
}

export async function getAllLawyers(options: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<ApiResult<{ lawyers: LawyerFull[]; total: number }>> {
  const { supabase } = await getAdminClient();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;

  try {
    let query = supabase
      .from('lawyers')
      .select(`
        *,
        specialties:lawyer_specialties(
          specialty:specialties(name)
        )
      `, { count: 'exact' });

    if (options.status && options.status !== 'all') {
      query = query.eq('verification_status', options.status);
    }

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const lawyers = (data ?? []).map((l: any) => ({
      ...l,
      specialties: l.specialties
        ? l.specialties.map((s: any) => ({ name: s.specialty?.name || s.name || '' }))
        : [],
    })) as LawyerFull[];

    return { data: { lawyers, total: count ?? 0 }, error: null };
  } catch (err: any) {
    console.error('Error fetching all lawyers:', err);
    return { data: null, error: { message: err.message, code: err.code || 'UNCAUGHT' } };
  }
}

export async function getPendingLawyers(): Promise<ApiResult<Lawyer[]>> {
  const { supabase } = await getAdminClient();
  return safeQuery('pending lawyers',
    supabase
      .from('lawyers')
      .select('id, name, role, location, email, phone, verification_status, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
  );
}

export async function getRecentSubscribers(): Promise<ApiResult<Subscriber[]>> {
  const { supabase } = await getAdminClient();
  return safeQuery('recent subscribers',
    supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  );
}

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  created_at: string;
  author: { full_name?: string } | { full_name?: string }[] | null;
}

export interface PodcastItem {
  id: string;
  title: string;
  slug: string;
  media_type: 'audio' | 'video';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  author: { full_name?: string } | { full_name?: string }[] | null;
}

export async function getAllArticles(options: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<ApiResult<{ articles: ArticleItem[]; total: number }>> {
  const { supabase } = await getAdminClient();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;

  try {
    let query = supabase
      .from('articles')
      .select('*, author:profiles(full_name)', { count: 'exact' });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: { articles: (data ?? []) as unknown as ArticleItem[], total: count ?? 0 }, error: null };
  } catch (err: any) {
    console.error('Error fetching articles:', err);
    return { data: null, error: { message: err.message, code: err.code || 'UNCAUGHT' } };
  }
}

export async function getAllPodcasts(options: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<ApiResult<{ podcasts: PodcastItem[]; total: number }>> {
  const { supabase } = await getAdminClient();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;

  try {
    let query = supabase
      .from('podcasts')
      .select('*, author:profiles(full_name)', { count: 'exact' });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: { podcasts: (data ?? []) as unknown as PodcastItem[], total: count ?? 0 }, error: null };
  } catch (err: any) {
    console.error('Error fetching podcasts:', err);
    return { data: null, error: { message: err.message, code: err.code || 'UNCAUGHT' } };
  }
}

export interface BrandPressItem {
  id: string;
  title: string;
  slug: string;
  brand_name: string | null;
  tier: string | null;
  payment_status: string;
  scheduled_date: string | null;
  featured_image: string | null;
  excerpt: string | null;
  content: string;
  status: string;
  created_at: string;
  author: { full_name?: string } | { full_name?: string }[] | null;
  amount?: number | null;
  contact_email?: string | null;
  tx_reference?: string | null;
}

export async function getBrandPressArticles(): Promise<ApiResult<BrandPressItem[]>> {
  const { supabase } = await getAdminClient();

  const [articleResult, txResult] = await Promise.all([
    safeQuery('brand press articles',
      supabase
        .from('articles')
        .select('*, author:profiles(full_name)')
        .eq('article_type', 'brand_press')
        .in('status', ['pending_review', 'published', 'draft', 'archived'])
        .order('created_at', { ascending: false })
    ),
    safeQuery('brand press transactions',
      supabase
        .from('transactions')
        .select('reference, amount, metadata')
        .like('plan_role', 'brand_press_%')
        .order('created_at', { ascending: false })
    ),
  ])

  const articles = (articleResult?.data ?? []) as BrandPressItem[]
  const transactions = (txResult?.data ?? []) as { reference: string; amount: number; metadata: Record<string, any> }[]

  const txByArticle = new Map<string, { amount: number; contact_email: string; reference: string }>()
  for (const tx of transactions) {
    const articleId = tx.metadata?.article_id
    if (articleId) {
      txByArticle.set(articleId, {
        amount: tx.amount,
        contact_email: tx.metadata?.contact_email || '',
        reference: tx.reference,
      })
    }
  }

  const enriched = articles.map(a => {
    const tx = txByArticle.get(a.id)
    return {
      ...a,
      amount: tx?.amount ?? null,
      contact_email: tx?.contact_email ?? null,
      tx_reference: tx?.reference ?? null,
    }
  })

  return { data: enriched, error: null };
}

export interface TransactionItem {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  plan_name: string
  plan_role: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  user_id: string | null
}

export async function getTransactions(): Promise<ApiResult<TransactionItem[]>> {
  const { supabase } = await getAdminClient();
  return safeQuery('transactions',
    supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
  );
}

export async function updateArticleAction(id: string, updates: Record<string, any>) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase.from('articles').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteArticleAction(id: string) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updatePodcastAction(id: string, updates: Record<string, any>) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase.from('podcasts').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deletePodcastAction(id: string) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase.from('podcasts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateLawyerAction(id: string, updates: Record<string, any>) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase
    .from('lawyers')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function verifyLawyerAction(id: string) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase
    .from('lawyers')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function rejectLawyerAction(id: string) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase
    .from('lawyers')
    .update({ verification_status: 'rejected' })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export type SettingEntry = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
};

export async function getAllSettings(): Promise<SettingEntry[]> {
  const { supabase } = await getAdminClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .order('key');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSetting(key: string): Promise<string | null> {
  const { supabase } = await getAdminClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return null;
  return data?.value ?? null;
}

export async function updateSetting(key: string, value: string) {
  const { supabase, user } = await getAdminClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) throw new Error(error.message);
  return { success: true };
}
