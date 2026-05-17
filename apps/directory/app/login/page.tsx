import Link from "next/link";
import LoginForm from "@/components/auth/login-form";
import Logo from "@/components/auth/logo";

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
        </div>
        <LoginForm />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Don't have an account? <Link href="/signup" className="font-bold hover:underline">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
}