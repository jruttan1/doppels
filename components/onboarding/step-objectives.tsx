"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Target, Plus, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepObjectivesProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepObjectives({ soulData, updateSoulData, onNext, onPrev }: StepObjectivesProps) {
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(
    soulData.networking_goals || []
  )
  const [currentGoal, setCurrentGoal] = useState("")

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

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Goals</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">What Are You Looking For?</h1>
        <p className="text-muted-foreground">
          Describe your networking goals. Be specific about what you're looking for in connections.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Networking Goals
            </CardTitle>
            <CardDescription>Describe what you're looking for in your connections. Be specific about your goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="e.g., Find a technical co-founder who has deep experience with Rust and distributed systems"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addGoal()
                  }
                }}
                className="bg-secondary/50"
              />
              <Button onClick={addGoal} variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </div>

            {networkingGoals.length > 0 && (
              <div className="space-y-2">
                {networkingGoals.map((goal, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="flex-1 text-sm">{goal}</p>
                    <button
                      onClick={() => removeGoal(index)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={networkingGoals.length === 0}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
