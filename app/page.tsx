import { LandingHero } from "@/components/landing/hero"
import { LandingNav } from "@/components/landing/nav"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CTA } from "@/components/landing/cta"
import { AnimatedBackground } from "@/components/landing/animated-background"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <LandingNav />
        <LandingHero />
        <HowItWorks />
        <CTA />
      </div>
    </main>
  )
}
