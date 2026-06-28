'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

export type PlanFeature = {
  name: string
  included: boolean
}

export type Plan = {
  id: string
  role: 'lawyer' | 'client' | 'chamber'
  name: string
  price: string
  period: string
  subtitle: string
  description: string
  recommended: boolean
  sort_order: number
  features: PlanFeature[]
}

export type PlansByRole = Record<string, Plan[]>

/**
 * Fetch all plans from the database, grouped by role.
 * Returns the same shape as the old config/pricing.json for backward compat.
 * Cached until revalidated via revalidateTag('plans').
 */
export const getPlans = unstable_cache(
  async (): Promise<PlansByRole> => {
    // Use anon client directly — no cookies() inside unstable_cache
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data) {
      console.error('Failed to fetch plans:', error?.message)
      return {}
    }

    const grouped: PlansByRole = {}
    for (const plan of data) {
      const role = plan.role as string
      if (!grouped[role]) grouped[role] = []

      grouped[role].push({
        id: plan.id,
        role: plan.role,
        name: plan.name,
        price: `$${Number(plan.price).toFixed(2)}`,
        period: plan.period,
        subtitle: plan.subtitle || '',
        description: plan.description || '',
        recommended: plan.recommended,
        sort_order: plan.sort_order,
        features: (plan.features as PlanFeature[]) || [],
      })
    }

    return grouped
  },
  ['plans'],
  { revalidate: 3600, tags: ['plans'] }
)

/**
 * Look up a single plan by name and role.
 * Used by the payment action to resolve price server-side.
 */
export async function getPlanByName(
  name: string,
  role: string
): Promise<{ price: number; period: string } | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plans')
    .select('price, period')
    .eq('name', name)
    .eq('role', role)
    .single()

  if (error || !data) return null

  return {
    price: Number(data.price),
    period: data.period,
  }
}
