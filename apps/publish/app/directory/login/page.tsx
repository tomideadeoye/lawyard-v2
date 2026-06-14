import LoginForm from "@/components/directory/auth/login-form";
import Logo from "@/components/directory/auth/logo";

export default async function LoginPage() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Securely sign in to manage your professional legal profile.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
