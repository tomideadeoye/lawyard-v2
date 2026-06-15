'use client'

import { Play } from 'lucide-react'

export interface TVVideo {
  id: string
  title: string
  slug: string
  description?: string | null
  media_url: string
  media_type: string
  duration?: string | null
  created_at: string
  author?: { full_name: string }[] | null
}

interface TVVideoCardProps {
  video: TVVideo
  onPlay: (video: TVVideo) => void
}

export function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

export function TVVideoCard({ video, onPlay }: TVVideoCardProps) {
  const ytThumbnail = getYouTubeThumbnail(video.media_url)
  const fallbackThumbnail = '/logo-blue.png' // fallback image

  const date = new Date(video.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      onClick={() => onPlay(video)}
      className="group relative flex flex-col bg-card/60 backdrop-blur-md rounded-2xl border border-border/60 overflow-hidden cursor-pointer hover:shadow-2xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-300 select-none"
    >
      {/* Video Thumbnail Container */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-950/40">
        {ytThumbnail ? (
          <img
            src={ytThumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#12102b] to-[#1e1a47]">
            <img
              src={fallbackThumbnail}
              alt="Lawyard Logo"
              className="h-10 w-auto opacity-30 object-contain mb-2 group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Lawyard Media</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-80 group-hover:opacity-100 group-hover:bg-black/50 transition-all duration-300">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-accent/90 text-foreground shadow-lg transform group-hover:scale-110 transition-all duration-300 group-hover:bg-accent group-hover:shadow-accent/40 group-hover:ring-4 group-hover:ring-accent/20">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">
            {video.duration}
          </span>
        )}
      </div>

      {/* Metadata / Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
          <span className="text-accent">Video</span>
          <span>•</span>
          <time>{date}</time>
        </div>

        <h3 className="font-bold text-base line-clamp-2 leading-snug group-hover:text-accent transition-colors flex-1">
          {video.title}
        </h3>

        {video.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}

        {video.author && video.author[0] && (
          <div className="mt-4 pt-3 border-t border-border/20 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              By {video.author[0].full_name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
