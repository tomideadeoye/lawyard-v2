'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentUrl?: string
}

export function ImageUpload({ onUpload, currentUrl }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }
    if (file.size > 500 * 1024) {
      setError('File is too large (max 500KB)')
      return
    }

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.set('image', file)

    try {
      const res = await fetch('/api/upload/brand-press', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setPreview(data.url)
      onUpload(data.url)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function remove() {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-bold mb-1.5">Featured Image</label>
      <p className="text-xs text-muted-foreground mb-3">
        Upload one header image (JPG, PNG, GIF supported). Max size: 500KB
      </p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="Featured" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group block"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            {uploading ? (
              <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted group-hover:bg-accent/10 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-accent">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, GIF or WebP (max 500KB)</p>
                </div>
              </>
            )}
          </div>
        </label>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
