import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/directory/dashboard/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Settings - Lawyard Dashboard',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/directory/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-[90vh] bg-background text-foreground py-10 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your profile, preferences, and billing details.</p>
          </div>
          <Link href="/directory/dashboard">
            <Button variant="outline" size="sm">
              &larr; Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Sidebar Navigation */}
          <div className="space-y-1">
            <Link href="/directory/dashboard/settings" className="block px-3 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-md">
              Profile details
            </Link>
            <button disabled className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-not-allowed opacity-50">
              Password & Security
            </button>
            <button disabled className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-not-allowed opacity-50">
              Billing & Subscription
            </button>
            <button disabled className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-not-allowed opacity-50">
              Notifications
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-3 space-y-6">
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your public name and primary role. This information is visible in your public directory profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm 
                  initialData={{
                    full_name: profile?.full_name || '',
                    role: profile?.role || 'clients',
                    avatar_url: profile?.avatar_url
                  }} 
                />
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
                <Button variant="destructive" disabled>Delete Account</Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
