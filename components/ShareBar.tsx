'use client'

import * as React from "react"

export default function ShareBar({ count = "0 SHARES" }: { count?: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = (platform: string) => {
    if (typeof window === "undefined") return
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent("Check out this article on Lawyard:")
    
    let shareUrl = ""
    if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    } else if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    } else if (platform === "whatsapp") {
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-4 border-b border-border/10 mb-8 select-none">
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-foreground mr-2 border border-border/80 rounded px-2.5 py-1.5 bg-muted/20">
        {count}
      </div>
      
      {/* Facebook */}
      <button 
        onClick={() => handleShare("facebook")}
        className="h-8 px-3.5 rounded bg-[#3b5998] hover:opacity-90 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-opacity"
      >
        Facebook
      </button>

      {/* Twitter */}
      <button 
        onClick={() => handleShare("twitter")}
        className="h-8 px-3.5 rounded bg-[#1da1f2] hover:opacity-90 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-opacity"
      >
        Twitter
      </button>

      {/* LinkedIn */}
      <button 
        onClick={() => handleShare("linkedin")}
        className="h-8 px-3.5 rounded bg-[#0077b5] hover:opacity-90 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-opacity"
      >
        LinkedIn
      </button>

      {/* WhatsApp */}
      <button 
        onClick={() => handleShare("whatsapp")}
        className="h-8 px-3.5 rounded bg-[#25d366] hover:opacity-90 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-opacity"
      >
        WhatsApp
      </button>

      {/* Copy Link */}
      <button 
        onClick={handleCopy}
        className="h-8 px-3.5 rounded border border-border hover:bg-muted text-foreground text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
      >
        {copied ? "Copied ✓" : "Copy Link"}
      </button>
    </div>
  )
}
