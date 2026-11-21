import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Corporate Posts – Lawyard',
    template: '%s – Corporate Posts – Lawyard',
  },
  description: 'Paid press releases and brand announcements on Lawyard — Nigeria\'s leading legal media platform.',
}

// The Paystack inline script lives on the submit page, the only place that
// uses it. Loading it for the whole section threw "put your Paystack Inline
// javascript file inside of a form element" on every article and listing.
export default function CorporatePostsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
