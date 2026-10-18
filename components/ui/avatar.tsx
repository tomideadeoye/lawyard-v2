import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'w-10 h-10 text-lg', md: 'w-16 h-16 text-2xl', lg: 'w-28 h-28 text-5xl' }

export function Avatar({ src, name, className, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className={cn(`rounded-xl overflow-hidden bg-gradient-to-br from-[#a77c5c] to-[#906b4e] flex items-center justify-center font-black text-white shrink-0 ${sizeMap[size]}`, className)}>
      {src?.startsWith('http') ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
