import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Brand Press – Lawyard',
    template: '%s – Brand Press – Lawyard',
  },
  description: 'Paid press releases and brand announcements on Lawyard — Nigeria\'s leading legal media platform.',
}

export default function BrandPressLayout({ children }: { children: React.ReactNode }) {
  return children
}
