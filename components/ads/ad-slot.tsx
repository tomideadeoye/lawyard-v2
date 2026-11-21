import { getAd, safeDestination, adClickPath, type AdPlacement } from '@/lib/ads'
import { AdBeacon } from '@/components/ads/ad-beacon'

/**
 * A single house-ad slot.
 *
 * Server component: the creative is resolved on the server from `ad_slots`, so
 * no ad API is exposed to the client and an empty slot costs nothing. The box
 * is sized from the stored image dimensions so the article does not jump when
 * the image loads, the destination goes through `safeDestination()` — an href is
 * third-party input, not something to trust — and both the click and the
 * impression are counted for the advertiser's report.
 */

interface AdSlotProps {
  placement: AdPlacement
  className?: string
}

const FRAME: Record<AdPlacement, string> = {
  'article-before': 'mx-auto max-w-[460px]',
  'article-after': 'mx-auto max-w-[460px]',
  'footer-banner': 'w-full',
  sidebar: 'w-full',
}

export default async function AdSlot({ placement, className }: AdSlotProps) {
  const ad = await getAd(placement)
  if (!ad) return null

  const destination = safeDestination(ad.href)
  if (!destination) return null

  const external = destination.startsWith('http')
  const width = ad.image_width && ad.image_width > 0 ? ad.image_width : undefined
  const height = ad.image_height && ad.image_height > 0 ? ad.image_height : undefined

  return (
    <aside
      aria-label={ad.label}
      className={['not-prose', FRAME[placement], className].filter(Boolean).join(' ')}
    >
      <AdBeacon adId={ad.id}>
        <a
          href={adClickPath(ad.id)}
          // The click goes through our counter first; the destination itself is
          // external, so the sponsored/opener protections still apply.
          {...(external ? { target: '_blank', rel: 'sponsored nofollow noopener noreferrer' } : {})}
          className="block no-underline group"
          data-ad-placement={placement}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.image_url}
            alt={ad.alt || ad.label}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-lg border border-border/40 object-contain transition-opacity group-hover:opacity-90"
          />
        </a>
      </AdBeacon>
      <span className="mt-2 block text-[8.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        {ad.label}
      </span>
    </aside>
  )
}
