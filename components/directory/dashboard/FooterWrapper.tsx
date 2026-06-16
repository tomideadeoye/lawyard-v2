'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/directory/Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  if (pathname.startsWith('/directory/dashboard')) return null
  return <Footer />
}
