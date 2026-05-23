import { cn } from "@repo/ui/lib/utils"

interface LogoProps {
  className?: string
}

import Image from "next/image";

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image 
        src="/lawyard-logo.png" 
        alt="Lawyard Logo" 
        width={160} 
        height={40} 
        className="object-contain"
      />
    </div>
  )
}
