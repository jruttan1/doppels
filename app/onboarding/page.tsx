import { OnboardingWizard } from "@/components/onboarding/wizard"

export const metadata = {
  title: "Create Your Soul File | s",
  description: "Set up your digital twin by uploading your documents and defining your goals.",
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <OnboardingWizard />
    </main>
  )
}
