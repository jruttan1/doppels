"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Orb from "@/components/landing/orb"

const LOADING_PHRASES = [
  "Synthesizing your digital essence...",
  "Mapping your professional DNA...",
  "Training your digital twin...",
  "Analyzing your unique patterns...",
  "Building neural pathways...",
  "Encoding your voice signature...",
  "Calibrating personality matrix...",
  "Assembling your network identity...",
]

const TIPS = [
  "I hate cold outreach just as much as you do",
  "It learns from your writing style to match your authentic voice",
  "Quality connections over quantity",
  "Your agent will only share already public info",
]

export default function CreatingPage() {
  const router = useRouter()
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)
  const [dots, setDots] = useState("")
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("pending")
  const onboardingStarted = useRef(false)

  // Start onboarding process
  useEffect(() => {
    if (onboardingStarted.current) return
    onboardingStarted.current = true

    const startOnboarding = async () => {
      try {
        // Get onboarding data from sessionStorage
        const onboardingData = sessionStorage.getItem('onboarding_data')
        
        if (onboardingData) {
          // Clear it so we don't re-trigger
          sessionStorage.removeItem('onboarding_data')
          sessionStorage.removeItem('onboarding_user_id')
          
          console.log("Starting onboarding API call...")
          
          // Call the onboarding API (this will trigger ingestion)
          fetch('/api/onboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: onboardingData,
          })
            .then(res => res.json())
            .then(data => {
              console.log("Onboarding API response:", data)
            })
            .catch(err => {
              console.error("Onboarding API error:", err)
            })
        }
      } catch (error) {
        console.error("Failed to start onboarding:", error)
      }
    }

    startOnboarding()
  }, [])

  // Poll for completion
  const checkStatus = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("ingestion_status, persona")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error checking status:", error)
        return
      }

      setStatus(data?.ingestion_status || "pending")

      if (data?.ingestion_status === "complete" && data?.persona) {
        // Add a small delay for dramatic effect
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else if (data?.ingestion_status === "failed") {
        // Still redirect to dashboard, they can retry from there
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (error) {
      console.error("Status check error:", error)
    }
  }, [router])

  // Initial check and polling
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [checkStatus])

  // Rotate loading phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % LOADING_PHRASES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Fake progress (speeds up near the end when complete)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (status === "complete") {
          return Math.min(prev + 5, 100)
        }
        // Slow down as we approach 90%
        if (prev >= 90) return prev
        if (prev >= 70) return prev + 0.3
        if (prev >= 50) return prev + 0.5
        return prev + 1
      })
    }, 150)
    return () => clearInterval(interval)
  }, [status])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[oklch(0.12_0.03_185)]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(45, 212, 191, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(45, 212, 191, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        
        {/* Orb container */}
        <div className="w-64 h-64 sm:w-80 sm:h-80 mb-8 relative">
          {/* Glow effect behind orb */}
          <div className="absolute inset-0 rounded-full bg-[oklch(0.75_0.15_185)] opacity-20 blur-3xl scale-110 animate-pulse" />
          <Orb 
            hue={165} 
            hoverIntensity={0.3}
            rotateOnHover={false}
            forceHoverState={true}
            backgroundColor="#0a0a0f"
          />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4">
          {status === "complete" ? (
            <span className="teal-glow">Agent Ready</span>
          ) : status === "failed" ? (
            <span className="text-red-400">Something went wrong</span>
          ) : (
            <>
              Awakening Your <span className="teal-glow">Doppel</span>
            </>
          )}
        </h1>

        {/* Loading phrase */}
        <div className="h-8 mb-8">
          <p className="text-white/50 text-lg transition-opacity duration-500">
            {status === "complete" 
              ? "Your digital twin is ready to network" 
              : status === "failed"
              ? "We'll retry automatically"
              : LOADING_PHRASES[currentPhrase]}
            <span className="inline-block w-6 text-left">{status === "pending" ? dots : ""}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-80 sm:w-96 mb-8">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[oklch(0.65_0.2_185)] to-[oklch(0.75_0.15_185)] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>Initializing</span>
            <span>{Math.round(progress)}%</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { label: "Profile Data", done: progress > 20 },
            { label: "Voice Pattern", done: progress > 40 },
            { label: "Network Goals", done: progress > 60 },
            { label: "Persona Synthesis", done: progress > 80 },
          ].map((step, i) => (
            <div 
              key={i}
              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-500 ${
                step.done 
                  ? "bg-[oklch(0.75_0.15_185)]/20 text-[oklch(0.85_0.12_185)] border border-[oklch(0.75_0.15_185)]/30" 
                  : "bg-white/5 text-white/30 border border-white/10"
              }`}
            >
              {step.done && <span className="mr-1">✓</span>}
              {step.label}
            </div>
          ))}
        </div>

        {/* Tips carousel */}
        <div className="max-w-md">
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6">
            <p className="text-xs text-white/30 mb-2">DID YOU KNOW?</p>
            <p className="text-sm text-white/60 transition-opacity duration-500">
              {TIPS[currentTip]}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.06_0.02_185)] to-transparent pointer-events-none" />
      
      {/* Animated particles (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[oklch(0.75_0.15_185)]"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              opacity: 0.3,
              animation: `float ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </main>
  )
}
