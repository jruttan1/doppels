"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Briefcase, FolderKanban, Plus, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface StepExperienceProjectsProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepExperienceProjects({ soulData, updateSoulData, onNext, onPrev }: StepExperienceProjectsProps) {
  const [experienceLog, setExperienceLog] = useState<string[]>(
    soulData.raw_assets?.experience_log || []
  )
  const [projectList, setProjectList] = useState<string[]>(
    soulData.raw_assets?.project_list || []
  )
  const [currentExperience, setCurrentExperience] = useState("")
  const [currentProject, setCurrentProject] = useState("")

  const addExperience = () => {
    if (currentExperience.trim()) {
      setExperienceLog((prev) => [...prev, currentExperience.trim()])
      setCurrentExperience("")
    }
  }

  const removeExperience = (index: number) => {
    setExperienceLog((prev) => prev.filter((_, i) => i !== index))
  }

  const addProject = () => {
    if (currentProject.trim()) {
      setProjectList((prev) => [...prev, currentProject.trim()])
      setCurrentProject("")
    }
  }

  const removeProject = (index: number) => {
    setProjectList((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    updateSoulData({
      raw_assets: {
        ...soulData.raw_assets,
        experience_log: experienceLog,
        project_list: projectList,
      },
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Experience & Projects</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Experience & Projects</h1>
        <p className="text-muted-foreground">
          Share your work history and notable projects. This helps your Doppel understand your background.
        </p>
      </div>

      <div className="space-y-6">
        {/* Experience Log */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Experience
            </CardTitle>
            <CardDescription>Add your work experience entries. Include role, company, duration, and key achievements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Senior Backend Engineer @ Stripe (2020-2023) - Core Payments Team. Led the migration of the legacy payment intents API to a new sharded architecture, reducing latency by 40% during peak Black Friday traffic."
                value={currentExperience}
                onChange={(e) => setCurrentExperience(e.target.value)}
                className="min-h-[100px] bg-secondary/50 resize-none"
              />
              <Button onClick={addExperience} variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Experience
              </Button>
            </div>

            {experienceLog.length > 0 && (
              <div className="space-y-2">
                {experienceLog.map((exp, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="flex-1 text-sm">{exp}</p>
                    <button
                      onClick={() => removeExperience(index)}
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

        {/* Project List */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Projects
            </CardTitle>
            <CardDescription>List your notable projects, repositories, or work samples.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Repo: rocket-rs (Rust) - A high performance, type-safe web server template designed for speed. Currently has 1.2k stars on GitHub and is used by several production startups."
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="min-h-[100px] bg-secondary/50 resize-none"
              />
              <Button onClick={addProject} variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Project
              </Button>
            </div>

            {projectList.length > 0 && (
              <div className="space-y-2">
                {projectList.map((project, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="flex-1 text-sm">{project}</p>
                    <button
                      onClick={() => removeProject(index)}
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
          <Button onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
