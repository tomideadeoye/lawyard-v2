import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/directory/dashboard/ProfileForm'
import PreferencesForm from '@/components/directory/dashboard/PreferencesForm'
import PasswordForm from '@/components/directory/dashboard/PasswordForm'
import { BillingPlanCard } from '@/components/directory/dashboard/BillingPlanCard'
import { BillingUpgradeCards } from '@/components/directory/dashboard/BillingUpgradeCards'
import { PaymentHistoryTable } from '@/components/directory/dashboard/PaymentHistoryTable'
import LawyerVerificationForm from '@/components/directory/dashboard/LawyerVerificationForm'
import DeleteAccountDialog from '@/components/directory/dashboard/DeleteAccountDialog'
import EmailChangeDialog from '@/components/directory/dashboard/EmailChangeDialog'
import { getPreferences } from '@/app/directory/actions/preferences'
import { getPlans } from '@/app/directory/actions/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Settings - Lawyard Dashboard',
}

const tabs = [
  { id: 'profile', label: 'Profile details' },
  { id: 'verification', label: 'Lawyer Verification' },
  { id: 'preferences', label: 'Notifications & Preferences' },
  { id: 'security', label: 'Password & Security' },
  { id: 'billing', label: 'Billing & Subscription' },
] as const

type TabId = (typeof tabs)[number]['id']

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab: TabId = tabs.some((t) => t.id === tab) ? (tab as TabId) : 'profile'

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  let profile: Record<string, any> | null = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  } catch {
    profile = null
  }

  let prefsResult: any = null
  let billingData: any[] = []
  let plans: any = {}

  try {
    if (activeTab === 'preferences') {
      prefsResult = await getPreferences()
    }
  } catch {
    prefsResult = { error: 'Failed to load preferences.' }
  }

  try {
    if (activeTab === 'billing') {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      billingData = data ?? []
    }
  } catch {
    billingData = []
  }

  try {
    if (activeTab === 'billing') {
      plans = await getPlans()
    }
  } catch {
    plans = {}
  }

  return (
    <div className="min-h-[90vh] bg-background text-foreground py-10 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your profile, preferences, and billing details.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              &larr; Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Tab Navigation */}
          <div className="space-y-1" role="tablist" aria-label="Settings tabs">
            {tabs.map((t) => {
              const href = t.id === 'profile' ? '/dashboard/settings' : `?tab=${t.id}`
              const isActive = activeTab === t.id
              return (
                <Link
                  key={t.id}
                  href={href}
                  role="tab"
                  aria-selected={isActive}
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="md:col-span-3 space-y-6" role="tabpanel">
            {activeTab === 'profile' && (
              <>
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
                  <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>
                      Manage your display name, contact details, social profiles, and public bio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm
                      initialData={{
                        display_name: profile?.full_name || '',
                        username: profile?.username || null,
                        first_name: profile?.first_name || '',
                        last_name: profile?.last_name || '',
                        email: user.email ?? '',
                        phone: profile?.phone || null,
                        website: profile?.website || null,
                        address: profile?.address || null,
                        about: profile?.about || null,
                        avatar_url: profile?.avatar_url,
                        facebook_url: profile?.facebook_url || null,
                        x_url: profile?.x_url || null,
                        linkedin_url: profile?.linkedin_url || null,
                        youtube_url: profile?.youtube_url || null,
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
                  <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>
                      Your email is used for login, notifications, and verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Email</label>
                      <EmailChangeDialog currentEmail={user.email ?? ''} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-rose-500/20 bg-rose-500/5 backdrop-blur-md shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-rose-600">Danger Zone</CardTitle>
                    <CardDescription>
                      Permanently delete your Lawyard account and all associated directory data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DeleteAccountDialog />
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'preferences' && (
              <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
                <CardHeader>
                  <CardTitle>Notifications &amp; Preferences</CardTitle>
                  <CardDescription>
                    Control how your profile appears to visitors and where inquiries are sent.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prefsResult && 'error' in prefsResult ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm rounded-md">
                      {prefsResult.error}
                    </div>
                  ) : (
                    <PreferencesForm
                      initialData={
                        prefsResult || {
                          hide_contact_form: false,
                          display_email: 'everyone',
                          contact_form_recipient: 'author_email',
                        }
                      }
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
                <CardHeader>
                  <CardTitle>Password &amp; Security</CardTitle>
                  <CardDescription>
                    Update your password and manage account security.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm
                    userEmail={user.email ?? ''}
                    hasPassword={
                      !!user.identities?.some(i => i.provider === 'email') ||
                      !!user.user_metadata?.has_password
                    }
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <BillingPlanCard
                  tier={profile?.subscription_tier || 'free'}
                  status={profile?.subscription_status}
                  expiresAt={profile?.subscription_expires_at}
                />
                <BillingUpgradeCards
                  currentTier={profile?.subscription_tier || 'free'}
                  userRole={profile?.role || 'client'}
                  plans={plans}
                />
                <PaymentHistoryTable transactions={billingData} />
              </div>
            )}

            {activeTab === 'verification' && (
              <LawyerVerificationForm />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
