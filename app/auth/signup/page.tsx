import { SignupForm } from "@/components/auth/signup-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export const metadata = {
  title: "Create Account | Doppels",
  description: "Create your Doppel account and deploy your digital twin",
}

export default function SignupPage() {
  return (
    <AuthLayout 
      title="Create your account" 
      description="Start your journey with agent-to-agent networking"
      ctaText="Ready to let AI do the networking? Deploy your digital twin and watch it discover incredible connections while you focus on what matters."
    >
      <SignupForm />
    </AuthLayout>
  )
}
