'use client'

import { useState } from 'react'
import { formatNGN } from '@/lib/currency'
import { createServiceRequest } from '@/app/directory/actions/service-requests'

const SERVICE_TYPES = [
  'Consultation',
  'Contract Review',
  'Legal Opinion',
  'Representation',
  'Compliance & Advisory',
  'Other',
]

const BUDGETS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'under_500k', label: 'Under ₦500,000' },
  { value: '500k_2.5m', label: '₦500,000 – ₦2,500,000' },
  { value: '2.5m_10m', label: '₦2,500,000 – ₦10,000,000' },
  { value: 'above_10m', label: '₦10,000,000+' },
]

interface ServiceRequestFormProps {
  lawyerId: string
  bookingFee: number
  defaultName?: string
  defaultEmail?: string
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]'

export default function ServiceRequestForm({
  lawyerId,
  bookingFee,
  defaultName = '',
  defaultEmail = '',
}: ServiceRequestFormProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState('')
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0])
  const [scope, setScope] = useState('')
  const [budget, setBudget] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !scope.trim()) {
      setError('Please add your name, email, and a short scope.')
      return
    }
    setPending(true)
    try {
      const res = await createServiceRequest({
        lawyerId,
        clientName: name,
        clientEmail: email,
        clientPhone: phone || undefined,
        serviceType,
        scope,
        budget: budget || undefined,
        preferredDate: preferredDate || undefined,
        message: message || undefined,
      })
      if (res.authorization_url) {
        window.location.href = res.authorization_url
        return
      }
      setError(res.error || 'Could not start checkout.')
    } catch {
      setError('Could not start checkout.')
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        A {formatNGN(bookingFee)} Lawyard booking fee confirms your request and shares your brief
        with the lawyer. The lawyer&apos;s professional fee is agreed directly with them.
      </p>

      <input className={inputClass} placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inputClass} type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={inputClass} type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <select className={inputClass} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
        {SERVICE_TYPES.map((t) => (
          <option key={t} value={t} className="bg-background">{t}</option>
        ))}
      </select>

      <textarea
        className={`${inputClass} resize-none`}
        placeholder="Scope — briefly describe what you need"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        rows={3}
        required
      />

      <select className={inputClass} value={budget} onChange={(e) => setBudget(e.target.value)}>
        {BUDGETS.map((b) => (
          <option key={b.value} value={b.value} className="bg-background">{b.label}</option>
        ))}
      </select>

      <input className={inputClass} type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />

      <textarea
        className={`${inputClass} resize-none`}
        placeholder="Anything else? (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
      />

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-xs font-bold transition-colors"
      >
        {pending ? 'Redirecting…' : `Pay ${formatNGN(bookingFee)} & Request Service`}
      </button>
    </form>
  )
}
