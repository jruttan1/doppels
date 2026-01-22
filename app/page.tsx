import { LandingHero } from "@/components/landing/hero"
import { LandingNav } from "@/components/landing/nav"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Personas } from "@/components/landing/personas"
import { CTA } from "@/components/landing/cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden relative">
      <div className="relative">
        <LandingNav />
        <LandingHero />
        <HowItWorks />
        <Personas />
        <CTA />
      </div>
    </main>
  )
}
