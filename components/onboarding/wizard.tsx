"use client"

import { useState, useMemo } from "react"
import { OnboardingHeader } from "./header"
import { StepDocuments } from "./step-documents"
import { StepVibeCheck } from "./step-vibe-check"
import { StepInterests } from "./step-interests"
import { StepObjectives } from "./step-objectives"
import { StepHiring } from "./step-hiring"
import { StepReview } from "./step-review"
import type { SoulFileData } from "@/lib/types"

// Goals that trigger the hiring step
const HIRING_GOALS = ["find a co-founder", "hire", "recruit", "cofounder", "hiring", "talent"]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [soulData, setSoulData] = useState<Partial<SoulFileData>>({
    skills_possessed: [],
    skills_desired: [],
    networking_goals: [],
    raw_assets: {
      voice_snippet: "",
    },
    filters: {
      locations: [],
    },
    isHiring: false,
    hiringSkillsDesired: [],
    hiringLocationsDesired: [],
  })

  // Check if user is hiring based on their goals
  const isHiring = useMemo(() => {
    const goals = soulData.networking_goals || []
    return goals.some(goal => 
      HIRING_GOALS.some(keyword => goal.toLowerCase().includes(keyword))
    )
  }, [soulData.networking_goals])

  // Dynamic steps based on whether user is hiring
  const steps = useMemo(() => {
    const baseSteps = ["Documents", "Vibe Check", "Interests", "Goals"]
    if (isHiring) {
      return [...baseSteps, "Hiring", "Review"]
    }
    return [...baseSteps, "Review"]
  }, [isHiring])

  const updateSoulData = (data: Partial<SoulFileData>) => {
    setSoulData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const renderStep = () => {
    // Map step index to component based on dynamic steps
    const stepName = steps[currentStep]
    
    switch (stepName) {
      case "Documents":
        return <StepDocuments soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} />
      case "Vibe Check":
        return <StepVibeCheck soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case "Interests":
        return <StepInterests soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case "Goals":
        return <StepObjectives soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case "Hiring":
        return <StepHiring soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case "Review":
        return <StepReview soulData={{...soulData, isHiring}} onPrev={prevStep} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader currentStep={currentStep} steps={steps} />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">{renderStep()}</div>
    </div>
  )
}
