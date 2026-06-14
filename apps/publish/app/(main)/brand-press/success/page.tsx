import Link from 'next/link'

export default function BrandPressSuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl text-green-500">✓</span>
      </div>
      <h1 className="text-3xl font-black mb-3">Submitted!</h1>
      <p className="text-muted-foreground mb-8">
        Your Brand Press has been submitted for review. We will review and publish it shortly.
      </p>
      <Link
        href="/brand-press"
        className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
      >
        View Brand Press
      </Link>
    </div>
  )
}
