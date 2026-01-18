"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StepObjectivesProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const MIN_CUSTOM_GOALS = 1

export function StepObjectives({ soulData, updateSoulData, onNext, onPrev }: StepObjectivesProps) {
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(
    soulData.networking_goals || []
  )
  const [currentGoal, setCurrentGoal] = useState("")
  const [inputFocused, setInputFocused] = useState(false)

  const addGoal = () => {
    if (currentGoal.trim() && !networkingGoals.includes(currentGoal.trim())) {
      setNetworkingGoals((prev) => [...prev, currentGoal.trim()])
      setCurrentGoal("")
    }
  }

  const removeGoal = (index: number) => {
    setNetworkingGoals((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    updateSoulData({ networking_goals: networkingGoals })
    onNext()
  }

  const goalsRemaining = Math.max(0, MIN_CUSTOM_GOALS - networkingGoals.length)
  const canContinue = networkingGoals.length >= MIN_CUSTOM_GOALS

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Goals
        </h1>
        <p className="text-white/50">
          Describe the specific connections you're looking for.
        </p>
      </div>

      <div className="space-y-8">
        {/* Instructions */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
          <p className="text-sm text-white/50">
            Be specific about who you want to meet. The more detail, the better we can match you.
          </p>
          <p className="text-xs text-white/30 mt-2">
            Examples: "A technical co-founder with backend experience in fintech" or "Angel investors focused on AI/ML startups"
          </p>
        </div>

        {/* Goals list */}
        {networkingGoals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Your goals</span>
              <span className="text-xs text-white/30">{networkingGoals.length} added</span>
            </div>
            <div className="space-y-2">
              {networkingGoals.map((goal, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <span className="text-white/30 text-sm font-mono">{index + 1}.</span>
                  <p className="flex-1 text-sm text-white">{goal}</p>
                  <button
                    onClick={() => removeGoal(index)}
                    className="p-1 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              placeholder="Describe a networking goal..."
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  addGoal()
                }
              }}
              rows={3}
              className={cn(
                "w-full bg-transparent border-2 rounded-xl text-base placeholder:text-white/20 focus:outline-none transition-colors p-4 resize-none",
                inputFocused ? "border-white/30" : "border-white/10"
              )}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">
              {goalsRemaining > 0 
                ? `Add ${goalsRemaining} more goal${goalsRemaining > 1 ? 's' : ''} to continue`
                : "Add more goals if you'd like"
              }
            </span>
            <button
              onClick={addGoal}
              disabled={!currentGoal.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={onPrev} 
            className="gap-2 text-white/50 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canContinue}
            className="gap-2 bg-white text-black hover:bg-white/90 border-0 h-12 px-6 disabled:opacity-30"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
