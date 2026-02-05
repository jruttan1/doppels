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
      <LoginForm />
    </AuthLayout>
  )
}
