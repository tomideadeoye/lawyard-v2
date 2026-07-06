import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignupForm from "@/components/directory/auth/signup-form";
import Logo from "@/components/directory/auth/logo";

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/directory/dashboard')

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Join Lawyard to manage your professional profile.
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}
