'use client'

import { useState, Suspense } from 'react'
import { setHours, setMinutes, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { submitBrandPress } from '@/app/actions/brand-press'
import { validateCoupon } from '@/app/actions/validate-coupon'
import config from '@/lib/brand-press.json'
import { PricingCard } from '@/components/PricingCard'
import { RichTextEditor } from '@/components/brand-press/rich-text-editor'
import { ImageUpload } from '@/components/brand-press/image-upload'
import { DatePicker } from '@/components/brand-press/date-picker'
import { TierComparisonModal } from '@/components/brand-press/tier-comparison-modal'
import { OrderSummary } from '@/components/brand-press/order-summary'
import { Lightbulb, ShieldCheck, Banknote, CreditCard, FileText, Tags, User } from 'lucide-react'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        ref: string
        metadata?: Record<string, any>
        callback: (response: { reference: string; trans: string; status: string; message: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

const brandPressSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  contact_name: z.string().optional(),
  title: z.string().min(1, 'Post title is required'),
  excerpt: z.string().max(160).optional(),
  brand_name: z.string().min(1, 'Brand name is required'),
  tier: z.enum(['basic', 'core', 'pro']),
  payment_method: z.enum(['card', 'transfer', 'invoice']),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions' }),
  }),
})

type FormValues = z.infer<typeof brandPressSchema>

export default function SubmitBrandPressPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SubmitForm />
    </Suspense>
  )
}

function SubmitForm() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>()
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [scheduleHour, setScheduleHour] = useState(10)
  const [scheduleMinute, setScheduleMinute] = useState(0)
  const [schedulePM, setSchedulePM] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ code: string; discountPercent: number; discountAmount: number; finalPrice: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(brandPressSchema),
    defaultValues: {
      tier: 'core',
      payment_method: 'card',
    },
  })

  const selectedTier = watch('tier')
  const paymentMethod = watch('payment_method')

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    setCouponError('')
    setCouponResult(null)

    const tier = config.tiers.find((t) => t.id === selectedTier)
    if (!tier) return

    const result = await validateCoupon(couponCode, tier.price)
    if (result.valid) {
      setCouponResult(result as { code: string; discountPercent: number; discountAmount: number; finalPrice: number })
    } else {
      setCouponError(result.message)
    }
    setApplyingCoupon(false)
  }

  async function onSubmit(data: FormValues) {
    const formData = new FormData()
    formData.set('email', data.email)
    formData.set('contact_name', data.contact_name || '')
    formData.set('title', data.title)
    formData.set('excerpt', data.excerpt || '')
    formData.set('brand_name', data.brand_name)
    formData.set('tier', data.tier)
    formData.set('payment_method', data.payment_method)
    formData.set('content', content)
    formData.set('featured_image', featuredImage)
    if (scheduledDate) {
      const hour24 = schedulePM ? (scheduleHour === 12 ? 12 : scheduleHour + 12) : (scheduleHour === 12 ? 0 : scheduleHour)
      const withTime = setMinutes(setHours(scheduledDate, hour24), scheduleMinute)
      const offset = timezone === 'Africa/Lagos' ? '+01:00' : '+00:00'
      formData.set('scheduled_date', `${formatDate(withTime)}T${format(withTime, 'HH:mm:ss')}${offset}`)
    }
    if (couponResult) {
      formData.set('coupon_code', couponResult.code)
      formData.set('final_price', String(couponResult.finalPrice))
      formData.set('discount_amount', String(couponResult.discountAmount))
    }

    const result = await submitBrandPress(formData)

    if (result.error) {
      setError(result.error)
      return
    }

    if ('success' in result && result.success) {
      router.push('/brand-press/success')
      return
    }

    if ('access_code' in result && result.access_code) {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: result.email,
        amount: result.amount,
        ref: result.reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Article Reference',
              variable_name: 'article_ref',
              value: result.reference,
            },
          ],
        },
        callback: function () {
          window.location.href = `/brand-press/success?reference=${result.reference}`
        },
        onClose: function () {
          window.location.href = '/brand-press/submit?cancelled=true'
        },
      })
      handler.openIframe()
    }
  }

  const tier = config.tiers.find((t) => t.id === selectedTier)
  const effectivePrice = couponResult?.finalPrice ?? tier?.price ?? 0

  return (
    <div className="min-h-screen bg-background">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Submit a Brand Press</h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Fill out the form to post your Brand Press on Lawyard. You can publish now or set a future date.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-10">
              <section className="space-y-5">
                <h2 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  Contact Information
                </h2>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-1.5">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="contact_name" className="block text-sm font-bold mb-1.5">Contact Name</label>
                  <input
                    id="contact_name"
                    type="text"
                    placeholder="Your full name"
                    {...register('contact_name')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </section>

              <section className="space-y-5">
                <h2 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Curate Your Brand Press
                </h2>
                <p className="text-xs text-muted-foreground -mt-3">
                  Make it count. Share the who, what, when, and h(w)ow.
                </p>

                <div>
                  <label htmlFor="title" className="block text-sm font-bold mb-1.5">Post Title *</label>
                  <input
                    id="title"
                    type="text"
                    required
                    placeholder="e.g. ABC Corp Announces Landmark Partnership"
                    {...register('title')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label htmlFor="excerpt" className="block text-sm font-bold mb-1.5">Post Summary</label>
                  <textarea
                    id="excerpt"
                    maxLength={160}
                    placeholder="Brief summary of your announcement (160 characters max)"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px] resize-y text-sm"
                    {...register('excerpt')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((watch('excerpt') || '').length)}/160
                  </p>
                </div>

                <ImageUpload onUpload={setFeaturedImage} />

                <div>
                  <label className="block text-sm font-bold mb-1.5">Post Body *</label>
                  <RichTextEditor content={content} onChange={setContent} />
                </div>
              </section>

              <section className="space-y-5">
                <h2 className="text-lg font-bold border-b border-border pb-3">Issuer Information</h2>

                <div>
                  <label htmlFor="brand_name" className="block text-sm font-bold mb-1.5">Brand / Client Name *</label>
                  <input
                    id="brand_name"
                    type="text"
                    required
                    placeholder="The brand or company being featured in this announcement"
                    {...register('brand_name')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                  {errors.brand_name && <p className="text-xs text-destructive mt-1">{errors.brand_name.message}</p>}
                </div>
              </section>

              <section className="space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold">Choose Your Visibility Level</h2>
                  <button
                    type="button"
                    onClick={() => setShowComparison(true)}
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    See comparison table
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {config.tiers.map((t) => (
                    <PricingCard
                      key={t.id}
                      name={t.name}
                      price={t.price}
                      formattedPrice={t.formatted_price}
                      description={t.description}
                      features={t.features}
                      recommended={t.recommended}
                      isSelected={selectedTier === t.id}
                      onClick={() => setValue('tier', t.id as 'basic' | 'core' | 'pro')}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-5">
                <h2 className="text-lg font-bold border-b border-border pb-3">When Do You Want to Publish?</h2>

                <DatePicker
                  selected={scheduledDate}
                  timezone={timezone}
                  hour={scheduleHour}
                  minute={scheduleMinute}
                  isPM={schedulePM}
                  onSelect={setScheduledDate}
                  onTimezoneChange={setTimezone}
                  onHourChange={setScheduleHour}
                  onMinuteChange={setScheduleMinute}
                  onPeriodChange={setSchedulePM}
                />
              </section>

              <section className="space-y-5">
                <h2 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-accent" />
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'transfer', label: 'Pay with Bank Transfer', icon: Banknote, desc: 'Direct bank deposit', disabled: true },
                    { id: 'invoice', label: 'Generate Invoice', icon: FileText, desc: 'Request an invoice' },
                    { id: 'card', label: 'Pay with Card', icon: CreditCard, desc: 'Visa, Mastercard' },
                  ].map((method) => {
                    const isDisabled = 'disabled' in method && method.disabled
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setValue('payment_method', method.id as 'card' | 'transfer' | 'invoice')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                          isDisabled
                            ? 'border-border/30 bg-muted/20 opacity-50 cursor-not-allowed'
                            : paymentMethod === method.id
                              ? 'border-accent bg-accent/[0.12] ring-2 ring-accent/25'
                              : 'border-border bg-card hover:border-accent/50'
                        }`}
                      >
                        {isDisabled && (
                          <span className="absolute -top-2 right-3 bg-muted-foreground text-[10px] text-background font-bold px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                        <method.icon className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground/50' : paymentMethod === method.id ? 'text-accent' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-bold ${paymentMethod === method.id && !isDisabled ? 'text-accent' : ''}`}>{method.label}</span>
                        <span className="text-[10px] text-muted-foreground">{method.desc}</span>
                      </button>
                    )})}
                </div>
              </section>

              <section className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <Tags className="h-4 w-4 text-accent" />
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 disabled:opacity-50 transition-all"
                  >
                    {applyingCoupon ? '...' : 'Apply Coupon'}
                  </button>
                </div>
                {couponResult && (
                  <p className="text-xs text-green-600 font-medium">
                    Coupon applied: {couponResult.discountPercent}% off
                  </p>
                )}
                {couponError && (
                  <p className="text-xs text-destructive font-medium">{couponError}</p>
                )}
              </section>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                    {...register('accepted_terms')}
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I accept{' '}
                    <a href="#" className="text-accent font-bold hover:underline">
                      Lawyard&apos;s Brand Press Content Policy
                    </a>
                    . By submitting, you confirm that you have the necessary rights to all content and images.
                  </span>
                </label>
                {errors.accepted_terms && (
                  <p className="text-xs text-destructive">{errors.accepted_terms.message}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Submit and pay'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <OrderSummary
                selectedTier={selectedTier}
                coupon={couponResult}
              />

              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Best Practices
                </h3>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Headlines:</span> Our readers engage more with short, punchy headlines. Aim for 10 to 12 words max!
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Length:</span> Concise press releases with an average of 800 words or less are most useful to readers.
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Images:</span> To display your images properly, verify that they match the recommended dimensions (1200×630px).
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3 lg:hidden">
                <h3 className="text-sm font-bold">Payment Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier</span>
                  <span className="font-medium">{tier?.name}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-border pt-3">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(effectivePrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <TierComparisonModal
        open={showComparison}
        onClose={() => setShowComparison(false)}
        onSelect={(id) => setValue('tier', id as 'basic' | 'core' | 'pro')}
        selectedTier={selectedTier}
      />
    </div>
  )
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
