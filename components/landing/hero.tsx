"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { VantaBackground } from "./vanta-background"

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 bg-background">
      <VantaBackground />
      <div className="absolute inset-0 bg-black/40 z-[1]" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="block text-balance text-white">Your Digital Twin</span>
          <span className="block mt-2 text-balance font-mono text-white" style={{ textShadow: '0 0 35px rgba(45, 212, 191, 0.2), 0 0 50px rgba(45, 212, 191, 0.3), 0 0 75px rgba(45, 212, 191, 0.4)' }}>Finds Your People</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 text-pretty font-normal">
          Don&apos;t replace the human connection. Instead, simulate the room to find the right connection. Your AI agent vets
          thousands of professionals while you sleep.
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
