import type React from 'react'
import { getAdminClient } from '@/lib/supabase/admin-auth'
import { createAdSlot, updateAdSlot, toggleAdSlot, deleteAdSlot } from '../actions'
import { AD_PLACEMENTS, type Ad } from '@/lib/ads'

export const dynamic = 'force-dynamic'

const PLACEMENT_LABELS: Record<string, string> = {
  'article-before': 'Article — above the body',
  'article-after': 'Article — below the body',
  'footer-banner': 'Full-width strip under the article',
  sidebar: 'Sidebar',
}

async function getAdSlots(): Promise<{ ads: Ad[]; error: string | null }> {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('ad_slots')
    .select('*')
    .order('placement')
    .order('weight', { ascending: false })

  if (error) return { ads: [], error: error.message }
  return { ads: (data ?? []) as Ad[], error: null }
}

function flightLabel(ad: Ad) {
  if (!ad.starts_at && !ad.ends_at) return 'Always on'
  const fmt = (v: string) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (ad.starts_at && ad.ends_at) return `${fmt(ad.starts_at)} → ${fmt(ad.ends_at)}`
  if (ad.starts_at) return `From ${fmt(ad.starts_at)}`
  return `Until ${fmt(ad.ends_at as string)}`
}

function isLive(ad: Ad) {
  const now = Date.now()
  if (!ad.is_active) return false
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return false
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return false
  return true
}

const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
const label = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'

export default async function AdsPage() {
  const { ads, error } = await getAdSlots()

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Ads</h1>
        <p className="text-red-500">
          Failed to load ad slots: {error}. The <code>ad_slots</code> table may not be applied yet —
          run <code>pnpm migrations:push</code>.
        </p>
      </div>
    )
  }

  const grouped = AD_PLACEMENTS.map((placement) => ({
    placement,
    items: ads.filter((ad) => ad.placement === placement),
  }))

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Ads</h1>
      <p className="text-sm text-slate-500 mb-8">
        House inventory, stored in the database — no deploy to change a creative. The image size
        you enter keeps the slot from shifting the page while it loads.
      </p>

      <section className="mb-12 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">New creative</h2>
        <form action={createAdSlot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="placement">Placement</label>
            <select id="placement" name="placement" className={input} required>
              {AD_PLACEMENTS.map((p) => (
                <option key={p} value={p}>{PLACEMENT_LABELS[p] ?? p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="label">Label</label>
            <input id="label" name="label" className={input} placeholder="Advertisement" defaultValue="Advertisement" />
          </div>
          <div className="md:col-span-2">
            <label className={label} htmlFor="image_url">Image URL</label>
            <input id="image_url" name="image_url" className={input} placeholder="https://…/banner.jpg" required />
          </div>
          <div className="md:col-span-2">
            <label className={label} htmlFor="href">Destination</label>
            <input id="href" name="href" className={input} placeholder="https://… or /contact" required />
          </div>
          <div className="md:col-span-2">
            <label className={label} htmlFor="alt">Alt text (what the creative says)</label>
            <input id="alt" name="alt" className={input} placeholder="DOA Handbook on Nigerian Competition Law, Volume 1" />
          </div>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div>
              <label className={label} htmlFor="image_width">Width</label>
              <input id="image_width" name="image_width" type="number" min="1" className={input} placeholder="499" />
            </div>
            <div>
              <label className={label} htmlFor="image_height">Height</label>
              <input id="image_height" name="image_height" type="number" min="1" className={input} placeholder="620" />
            </div>
            <div>
              <label className={label} htmlFor="weight">Weight</label>
              <input id="weight" name="weight" type="number" className={input} placeholder="10" />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="starts_at">Starts</label>
            <input id="starts_at" name="starts_at" type="datetime-local" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="ends_at">Ends</label>
            <input id="ends_at" name="ends_at" type="datetime-local" className={input} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-5 py-2.5">
              Add creative
            </button>
          </div>
        </form>
      </section>

      {grouped.map(({ placement, items }) => (
        <section key={placement} className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">
            {PLACEMENT_LABELS[placement] ?? placement}
            <span className="ml-2 font-normal normal-case text-slate-400">
              {items.filter(isLive).length} live / {items.length}
            </span>
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg p-4">
              Nothing booked here — the slot renders nothing.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((ad) => (
                <article key={ad.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-4">
                  <img src={ad.image_url} alt="" className="h-24 w-auto rounded border border-slate-100 object-contain bg-slate-50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${
                          isLive(ad) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isLive(ad) ? 'Live' : ad.is_active ? 'Scheduled / expired' : 'Paused'}
                      </span>
                      <span className="text-[11px] text-slate-400">weight {ad.weight} · {flightLabel(ad)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{ad.alt || ad.label}</p>
                    <p className="text-xs text-slate-500 truncate">{ad.href}</p>

                    <form action={updateAdSlot} className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                      <input type="hidden" name="id" value={ad.id} />
                      <div className="col-span-2 md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Image URL</label>
                        <input name="image_url" defaultValue={ad.image_url} className={input} />
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Destination</label>
                        <input name="href" defaultValue={ad.href} className={input} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Weight</label>
                        <input name="weight" type="number" defaultValue={ad.weight} className={input} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Alt</label>
                        <input name="alt" defaultValue={ad.alt ?? ''} className={input} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">W</label>
                        <input name="image_width" type="number" defaultValue={ad.image_width ?? ''} className={input} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">H</label>
                        <input name="image_height" type="number" defaultValue={ad.image_height ?? ''} className={input} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Label</label>
                        <input name="label" defaultValue={ad.label} className={input} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Starts</label>
                        <input name="starts_at" type="datetime-local" defaultValue={ad.starts_at ? ad.starts_at.slice(0, 16) : ''} className={input} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Ends</label>
                        <input name="ends_at" type="datetime-local" defaultValue={ad.ends_at ? ad.ends_at.slice(0, 16) : ''} className={input} />
                      </div>
                      <div>
                        <button type="submit" className="rounded-lg bg-slate-900 text-white text-xs font-semibold px-3 py-2 w-full">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <form action={toggleAdSlot}>
                      <input type="hidden" name="id" value={ad.id} />
                      <input type="hidden" name="next" value={String(!ad.is_active)} />
                      <button type="submit" className="rounded-lg border border-slate-200 text-xs font-semibold px-3 py-2 w-full">
                        {ad.is_active ? 'Pause' : 'Resume'}
                      </button>
                    </form>
                    <form action={deleteAdSlot}>
                      <input type="hidden" name="id" value={ad.id} />
                      <button type="submit" className="rounded-lg border border-red-200 text-red-600 text-xs font-semibold px-3 py-2 w-full">
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
