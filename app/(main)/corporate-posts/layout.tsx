import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Corporate Posts – Lawyard',
    template: '%s – Corporate Posts – Lawyard',
  },
  description: 'Paid press releases and brand announcements on Lawyard — Nigeria\'s leading legal media platform.',
}

export default function CorporatePostsLayout({ children }: { children: React.ReactNode }) {
  return children
}
