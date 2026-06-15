'use client'

import { useState, useMemo } from 'react'
import { TVVideo, TVVideoCard, getYouTubeId, getYouTubeThumbnail } from '@/components/ui/tv-video-card'
import { Search, X, Play, Info } from 'lucide-react'

interface TVPageClientProps {
  initialVideos: TVVideo[]
}

const CATEGORIES = [
  { id: 'all', name: 'All Videos' },
  { id: 'nls', name: 'Law School & NLS' },
  { id: 'democracy', name: 'Democracy & Dialogue' },
  { id: 'energy', name: 'Energy & Infrastructure' },
]

export default function TVPageClient({ initialVideos }: TVPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [playingVideo, setPlayingVideo] = useState<TVVideo | null>(null)

  // Extract featured video (newest video)
  const featuredVideo = initialVideos[0]

  // Remaining videos for the grid
  const remainingVideos = useMemo(() => {
    return initialVideos.slice(1)
  }, [initialVideos])

  // Filter videos dynamically based on category and search
  const filteredVideos = useMemo(() => {
    let list = remainingVideos

    // 1. Filter by category
    if (activeCategory === 'nls') {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes('nls') ||
          v.title.toLowerCase().includes('law school') ||
          v.description?.toLowerCase().includes('law school')
      )
    } else if (activeCategory === 'democracy') {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes('democracy') ||
          v.title.toLowerCase().includes('dialogue') ||
          v.title.toLowerCase().includes('moghalu')
      )
    } else if (activeCategory === 'energy') {
      list = list.filter((v) => v.title.toLowerCase().includes('energy'))
    }

    // 2. Filter by search query
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      )
    }

    return list
  }, [remainingVideos, activeCategory, searchQuery])

  // Helper to resolve video player source/embed URL
  const videoEmbedUrl = useMemo(() => {
    if (!playingVideo) return null
    const ytId = getYouTubeId(playingVideo.media_url)
    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
    }
    return playingVideo.media_url
  }, [playingVideo])

  const featuredThumbnail = featuredVideo
    ? getYouTubeThumbnail(featuredVideo.media_url) || '/logo-blue.png'
    : '/logo-blue.png'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-slate-950/20 text-foreground pb-24">
      {/* Featured Cinematic Hero Section */}
      {featuredVideo && (
        <section className="relative w-full aspect-[21/9] min-h-[400px] flex items-end overflow-hidden border-b border-border/30">
          {/* Background Blurred Image / Overlay */}
          <div className="absolute inset-0 bg-slate-950">
            <img
              src={featuredThumbnail}
              alt={featuredVideo.title}
              className="w-full h-full object-cover opacity-25 scale-105 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          </div>

          <div className="relative max-w-6xl mx-auto w-full px-6 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
            {/* Info Block */}
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4 border border-accent/20">
                <Play className="h-3 w-3 fill-current" /> Spotlight Featured Video
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-foreground drop-shadow-sm">
                {featuredVideo.title}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mb-6 line-clamp-3 leading-relaxed">
                {featuredVideo.description}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setPlayingVideo(featuredVideo)}
                  className="px-6 py-3.5 bg-accent hover:bg-accent/90 text-foreground rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] cursor-pointer"
                >
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                  Watch Video Now
                </button>
              </div>
            </div>

            {/* Video Preview Card aspect */}
            <div
              onClick={() => setPlayingVideo(featuredVideo)}
              className="hidden md:block w-72 aspect-[16/9] rounded-xl overflow-hidden border border-white/10 shadow-2xl relative cursor-pointer group shrink-0"
            >
              <img
                src={featuredThumbnail}
                alt="Featured Video Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-accent text-foreground shadow-md">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters and Search Bar Container */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
          {/* Categories Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search TV archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-card/30 backdrop-blur-sm border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid of Video Cards */}
      <section className="max-w-6xl mx-auto px-6 mt-10">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-border/50 backdrop-blur-sm">
            <Info className="h-8 w-8 text-muted-foreground/45 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-2">
              No videos found matching your query or selected filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
              className="text-xs font-bold text-accent hover:underline uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <TVVideoCard key={video.id} video={video} onPlay={setPlayingVideo} />
            ))}
          </div>
        )}
      </section>

      {/* Video Lightbox Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          {/* Close Backdrop */}
          <div className="absolute inset-0" onClick={() => setPlayingVideo(null)} />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl aspect-[16/9] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10 flex flex-col justify-center animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-accent transition-colors z-20 cursor-pointer shadow-lg"
              aria-label="Close player"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Video Element */}
            {getYouTubeId(playingVideo.media_url) ? (
              <iframe
                src={videoEmbedUrl!}
                title={playingVideo.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={playingVideo.media_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
