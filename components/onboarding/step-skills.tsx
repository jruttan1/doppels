"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Code, Target, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepSkillsProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const SUGGESTED_SKILLS = ["React", "Python", "TypeScript", "AI/ML", "Product Management", "Go", "Rust", "Design", "Distributed Systems", "Backend Development", "Kubernetes", "LLMs"]

export function StepSkills({ soulData, updateSoulData, onNext, onPrev }: StepSkillsProps) {
  const [skillsPossessed, setSkillsPossessed] = useState<string[]>(soulData.skills_possessed || [])
  const [skillsDesired, setSkillsDesired] = useState<string[]>(soulData.skills_desired || [])
  const [possessedInput, setPossessedInput] = useState("")
  const [desiredInput, setDesiredInput] = useState("")

  const addPossessedSkill = (skill: string) => {
    if (skill && !skillsPossessed.includes(skill)) {
      setSkillsPossessed((prev) => [...prev, skill])
      setPossessedInput("")
    }
  }

  const removePossessedSkill = (skill: string) => {
    setSkillsPossessed((prev) => prev.filter((s) => s !== skill))
  }

  const addDesiredSkill = (skill: string) => {
    if (skill && !skillsDesired.includes(skill)) {
      setSkillsDesired((prev) => [...prev, skill])
      setDesiredInput("")
    }
  }

  const removeDesiredSkill = (skill: string) => {
    setSkillsDesired((prev) => prev.filter((s) => s !== skill))
  }

  const handleNext = () => {
    updateSoulData({
      skills_possessed: skillsPossessed,
      skills_desired: skillsDesired,
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Code className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Skills</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Skills</h1>
        <p className="text-muted-foreground">
          What skills do you have, and what skills are you looking for in connections?
        </p>
      </div>

      <div className="space-y-6">
        {/* Skills Possessed */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Skills You Have
            </CardTitle>
            <CardDescription>List the skills and technologies you're proficient in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={possessedInput}
                onChange={(e) => setPossessedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addPossessedSkill(possessedInput)
                  }
                }}
                className="bg-secondary/50"
              />
              <Button variant="outline" onClick={() => addPossessedSkill(possessedInput)} className="shrink-0 bg-transparent">
                Add
              </Button>
            </div>

            {skillsPossessed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillsPossessed.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      onClick={() => removePossessedSkill(skill)}
                      className="ml-1 p-0.5 hover:bg-background/50 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter((s) => !skillsPossessed.includes(s)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addPossessedSkill(skill)}
                  >
                    + {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Desired */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Skills You're Looking For
            </CardTitle>
            <CardDescription>What skills should your connections have?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={desiredInput}
                onChange={(e) => setDesiredInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addDesiredSkill(desiredInput)
                  }
                }}
                className="bg-secondary/50"
              />
              <Button variant="outline" onClick={() => addDesiredSkill(desiredInput)} className="shrink-0 bg-transparent">
                Add
              </Button>
            </div>

            {skillsDesired.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillsDesired.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      onClick={() => removeDesiredSkill(skill)}
                      className="ml-1 p-0.5 hover:bg-background/50 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter((s) => !skillsDesired.includes(s)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addDesiredSkill(skill)}
                  >
                    + {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
