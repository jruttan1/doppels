"use client"

import { useState } from "react"
import { OnboardingHeader } from "./header"
import { StepDocuments } from "./step-documents"
import { StepSkills } from "./step-skills"
import { StepVibeCheck } from "./step-vibe-check"
import { StepExperienceProjects } from "./step-experience-projects"
import { StepInterests } from "./step-interests"
import { StepObjectives } from "./step-objectives"
import { StepFilters } from "./step-filters"
import { StepReview } from "./step-review"
import type { SoulFileData } from "@/lib/types"

const STEPS = ["Documents", "Skills", "Vibe Check", "Experience & Projects", "Interests", "Goals", "Filters", "Review"]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [soulData, setSoulData] = useState<Partial<SoulFileData>>({
    skills_possessed: [],
    skills_desired: [],
    networking_goals: [],
    raw_assets: {
      voice_snippet: "",
      experience_log: [],
      project_list: [],
      interests: [],
    },
    filters: {
      locations: [],
      skills: [],
      experienceYears: 0,
    },
  })

  const updateSoulData = (data: Partial<SoulFileData>) => {
    setSoulData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepDocuments soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} />
      case 1:
        return <StepSkills soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case 2:
        return <StepVibeCheck soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case 3:
        return (
          <StepExperienceProjects
            soulData={soulData}
            updateSoulData={updateSoulData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 4:
        return <StepInterests soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return (
          <StepObjectives soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
        )
      case 6:
        return <StepFilters soulData={soulData} updateSoulData={updateSoulData} onNext={nextStep} onPrev={prevStep} />
      case 7:
        return <StepReview soulData={soulData} onPrev={prevStep} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader currentStep={currentStep} steps={STEPS} />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">{renderStep()}</div>
    </div>
  )
}
