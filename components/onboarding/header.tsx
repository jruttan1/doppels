import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OnboardingHeaderProps {
  currentStep: number
  steps: string[]
}

export function OnboardingHeader({ currentStep, steps }: OnboardingHeaderProps) {
  return (
    <header className="border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Doppel" width={40} height={40} />
            <span className="text-xl font-bold font-mono text-white">
              Doppels
            </span>
          </Link>

          <span className="text-xs text-white/30">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Minimal progress bar */}
        <div className="relative">
          <div className="h-0.5 bg-white/5 rounded-full" />
          <div
            className="absolute top-0 left-0 h-0.5 bg-white/50 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index < currentStep
                    ? "bg-white/50"
                    : index === currentStep
                      ? "bg-white ring-4 ring-white/10"
                      : "bg-white/10",
                )}
              />
              <span
                className={cn(
                  "mt-2 text-xs transition-colors",
                  index === currentStep 
                    ? "text-white/80" 
                    : index < currentStep 
                      ? "text-white/40" 
                      : "text-white/20",
                )}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
