'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { PreferencesData, DisplayEmail, ContactFormRecipient } from '@/app/directory/actions/preferences'

interface PreferencesFormProps {
  initialData: PreferencesData
}

export default function PreferencesForm({ initialData }: PreferencesFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const res = await import('@/app/directory/actions/preferences').then(m =>
      m.updatePreferences(formData)
    )

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }

    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-md">
          Preferences saved successfully!
        </div>
      )}

      {/* Hide Contact Form */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hide_contact_form"
            name="hide_contact_form"
            defaultChecked={initialData.hide_contact_form}
            className="w-4 h-4 rounded border-border accent-[#a77c5c]"
          />
          <Label htmlFor="hide_contact_form" className="text-sm font-medium cursor-pointer">
            Hide contact form in my listings
          </Label>
        </div>
        <p className="text-xs text-muted-foreground ml-7">
          When enabled, visitors won&apos;t see the inquiry form on your directory listings.
        </p>
      </div>

      <hr className="border-border/40" />

      {/* Display Email */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Display Email on Author Page</legend>
        <p className="text-xs text-muted-foreground">
          Control who can see your email address on your public profile.
        </p>
        <div className="space-y-2">
          {([
            { value: 'everyone', label: 'Display to Everyone' },
            { value: 'logged_in_only', label: 'Display to Logged in Users Only' },
            { value: 'dont_display', label: "Don't Display" },
          ] as { value: DisplayEmail; label: string }[]).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-[#a77c5c]/40 has-[:checked]:bg-[#a77c5c]/5"
            >
              <input
                type="radio"
                name="display_email"
                value={opt.value}
                defaultChecked={initialData.display_email === opt.value}
                className="w-4 h-4 text-[#a77c5c] border-border accent-[#a77c5c]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <hr className="border-border/40" />

      {/* Contact Form Recipient */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Contact Listing Owner Form Recipient</legend>
        <p className="text-xs text-muted-foreground">
          Choose where inquiry messages from your listings are sent.
        </p>
        <div className="space-y-2">
          {([
            { value: 'author_email', label: 'Author Email' },
            { value: 'listing_email', label: "Listing's Email" },
          ] as { value: ContactFormRecipient; label: string }[]).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-[#a77c5c]/40 has-[:checked]:bg-[#a77c5c]/5"
            >
              <input
                type="radio"
                name="contact_form_recipient"
                value={opt.value}
                defaultChecked={initialData.contact_form_recipient === opt.value}
                className="w-4 h-4 text-[#a77c5c] border-border accent-[#a77c5c]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending} className="w-full glow-primary">
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
