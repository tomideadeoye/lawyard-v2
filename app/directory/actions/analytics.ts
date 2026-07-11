'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function trackProfileView(lawyerId: string) {
  const cookieStore = await cookies();
  const cookieName = `pv_${lawyerId}`;

  // Only track once per 30 min per lawyer per browser
  if (cookieStore.get(cookieName)) return;

  try {
    const supabase = await createClient();
    await supabase.from('profile_views').insert({
      lawyer_id: lawyerId,
      referrer: 'direct',
    });
  } catch {
    // Silent fail — tracking should never block the page
  }
}

export async function getProfileViews(lawyerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== lawyerId) return { daily: [], total: 0, change: 0 };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: all } = await supabase
    .from('profile_views')
    .select('date')
    .eq('lawyer_id', lawyerId)
    .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
    .order('date');

  const total = all?.length || 0;

  // Group by date
  const grouped = new Map<string, number>();
  all?.forEach(v => {
    const d = v.date.slice(0, 10);
    grouped.set(d, (grouped.get(d) || 0) + 1);
  });

  const daily = Array.from(grouped.entries()).map(([date, count]) => ({ date, count }));

  // Compare last 7 days vs previous 7
  const now = new Date();
  const last7 = all?.filter(v => {
    const d = new Date(v.date + 'T00:00:00');
    return d >= new Date(now.getTime() - 7 * 86400000);
  }).length || 0;

  const prev7 = all?.filter(v => {
    const d = new Date(v.date + 'T00:00:00');
    return d >= new Date(now.getTime() - 14 * 86400000) && d < new Date(now.getTime() - 7 * 86400000);
  }).length || 0;

  const change = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

  return { daily, total, change };
}

export async function getInquiryStats(lawyerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== lawyerId) return { total: 0, unread: 0, change: 0 };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from('lawyer_inquiries')
    .select('created_at, read')
    .eq('lawyer_id', lawyerId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at');

  const total = data?.length || 0;
  const unread = data?.filter(i => !i.read).length || 0;

  const now = new Date();
  const last7 = data?.filter(i => new Date(i.created_at) >= new Date(now.getTime() - 7 * 86400000)).length || 0;
  const prev7 = data?.filter(i => {
    const d = new Date(i.created_at);
    return d >= new Date(now.getTime() - 14 * 86400000) && d < new Date(now.getTime() - 7 * 86400000);
  }).length || 0;

  const change = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

  return { total, unread, change };
}
