"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Orb from "./orb"

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 bg-background overflow-hidden">
      <div className="absolute inset-0 z-[2]">
        <Orb hue={61} hoverIntensity={0.42} />
      </div>
      <div className="absolute inset-0 bg-black/40 z-[3]" />
      <div className="relative z-[4] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="block text-balance font-bold text-white" style={{ fontFamily: '"Bitter", serif' }}>Your Digital Self</span>
          <span className="block mt-2 text-balance font-mono text-white" style={{ textShadow: '0 0 35px rgba(45, 212, 191, 0.2), 0 0 50px rgba(45, 212, 191, 0.3), 0 0 75px rgba(45, 212, 191, 0.4)' }}>Connecting 24/7</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 text-pretty font-normal">
          Deploy your digital twin to vet thousands of potential connections while you sleep. Only take the meetings that matter.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">
              Deploy Your Doppel
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
