'use client'

import { useState } from 'react'
import { submitLawyerVerification } from '@/app/directory/actions/verify-lawyer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Scale } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

type VerificationStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function LawyerVerificationForm() {
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [error, setError] = useState('')
  const [phone, setPhone] = useState<string>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    if (!phone?.trim()) {
      setError('Phone number is required')
      setStatus('error')
      return
    }

    const form = new FormData(e.currentTarget)
    const result = await submitLawyerVerification({
      full_name: form.get('full_name') as string,
      scn: form.get('scn') as string,
      year_of_call: parseInt(form.get('year_of_call') as string, 10),
      phone: phone || '',
      firm_name: form.get('firm_name') as string,
    })

    if (result.error) {
      setError(result.error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <Card className="border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto">
            <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-base">Verification Submitted</CardTitle>
          <CardDescription className="text-sm">
            Your request has been sent to the admin team for review. You will be notified once your
            status is updated. This typically takes 1-2 business days.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5 text-[#a77c5c]" />
          Verify as a Lawyer
        </CardTitle>
        <CardDescription>
            Submit your Nigerian bar details to earn the verified badge on your profile. You need
            your Supreme Court Number (SCN). This is optional — you can already use all lawyer
            features without verification.
          </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name (as registered with the bar)</Label>
            <Input id="full_name" name="full_name" required placeholder="e.g. Tomide Adeoye" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scn">Supreme Court Number (SCN)</Label>
            <Input id="scn" name="scn" required placeholder="e.g. SCN/12345" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year_of_call">Year of Call to Bar</Label>
              <Input
                id="year_of_call"
                name="year_of_call"
                type="number"
                required
                min={1950}
                max={new Date().getFullYear()}
                placeholder="e.g. 2015"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <PhoneInput
                international
                defaultCountry="NG"
                value={phone}
                onChange={(v) => setPhone(v || '')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>input]:border-0 [&>input]:outline-none [&>input]:ring-0 [&>input]:bg-transparent [&>input]:p-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firm_name">Firm / Chamber</Label>
            <Input id="firm_name" name="firm_name" required placeholder="e.g. Renix Consulting" />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          <Button type="submit" disabled={status === 'submitting'} className="w-full">
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Verification'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
