import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LawyerForm from '@/components/directory/forms/LawyerForm';
import ChamberForm from '@/components/directory/forms/ChamberForm';
import ClientNeedForm from '@/components/directory/forms/ClientNeedForm';
import { Card } from '@/components/ui/card';
import { DirectoryRole } from '@/lib/api';

export default async function DashboardAddListingPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/directory/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || DirectoryRole.CLIENT;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {role === DirectoryRole.CLIENT ? 'Post a Legal Brief' : 'Complete your Directory Listing'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {role === DirectoryRole.CLIENT ? 
            'Describe your situation so our vetted experts can contact you.' : 
            'Our verification team will review your details once submitted.'}
        </p>
      </div>

      <Card className="border border-border/40 bg-card/45 backdrop-blur-md p-6 sm:p-8">
        {role === DirectoryRole.CLIENT && <ClientNeedForm />}
        {role === DirectoryRole.LAWYER && <LawyerForm />}
        {role === DirectoryRole.CHAMBER && <ChamberForm />}
      </Card>
    </div>
  );
}
