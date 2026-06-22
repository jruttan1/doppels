import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export const metadata = {
  title: "Sign In | Doppels",
  description: "Sign in to your Doppel account",
}

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Welcome back" 
      description="Sign in to your account to continue networking"
      ctaText="Your digital twin is waiting. Jump back in and watch it work 24/7 to find your perfect matches."
    >
      <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            HP
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Visual artifact</p>
            <p className="text-2xl font-bold leading-tight text-foreground">hi primate</p>
          </div>
        </div>
      </div>
      <LoginForm />
    </AuthLayout>
  )
}
