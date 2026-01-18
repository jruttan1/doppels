"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Github, Linkedin, MessageSquare, Target, Filter, X, Upload, MapPin, Code, Clock, Heart, Briefcase, FolderKanban, Plus } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

const SUGGESTED_LOCATIONS = ["North America", "Europe", "Remote", "San Francisco", "New York", "London", "Singapore"]
const SUGGESTED_SKILLS = ["React", "Python", "TypeScript", "AI/ML", "Product Management", "Go", "Rust", "Design", "Distributed Systems", "Backend Development", "Kubernetes", "LLMs"]
const SUGGESTED_INTERESTS = ["LLMs", "High-Performance Computing", "Mechanical Keyboards", "Biohacking", "Indie Hacking", "Espresso Brewing", "Open Source", "Startups", "AI/ML", "Distributed Systems", "Developer Tools", "Product Design"]

export function SettingsView() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "documents")
  
  // Mock data - in real app, fetch from database
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

  const [linkedinUrl, setLinkedinUrl] = useState(soulData.linkedinUrl || "")
  const [githubUrl, setGithubUrl] = useState(soulData.githubUrl || "")
  const [vibeCheck, setVibeCheck] = useState(soulData.raw_assets?.voice_snippet || soulData.vibeCheck || "")
  const [skillsPossessed, setSkillsPossessed] = useState<string[]>(soulData.skills_possessed || [])
  const [skillsDesired, setSkillsDesired] = useState<string[]>(soulData.skills_desired || [])
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(soulData.networking_goals || [])
  const [experienceLog, setExperienceLog] = useState<string[]>(soulData.raw_assets?.experience_log || [])
  const [projectList, setProjectList] = useState<string[]>(soulData.raw_assets?.project_list || [])
  const [interests, setInterests] = useState<string[]>(soulData.raw_assets?.interests || [])
  const [locations, setLocations] = useState<string[]>(soulData.filters?.locations || [])
  const [filterSkills, setFilterSkills] = useState<string[]>(soulData.filters?.skills || [])
  const [experienceYears, setExperienceYears] = useState(soulData.filters?.experienceYears || 0)
  
  const [possessedInput, setPossessedInput] = useState("")
  const [desiredInput, setDesiredInput] = useState("")
  const [goalInput, setGoalInput] = useState("")
  const [currentExperience, setCurrentExperience] = useState("")
  const [currentProject, setCurrentProject] = useState("")
  const [interestInput, setInterestInput] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [skillInput, setSkillInput] = useState("")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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

  const addGoal = () => {
    if (goalInput.trim() && !networkingGoals.includes(goalInput.trim())) {
      setNetworkingGoals((prev) => [...prev, goalInput.trim()])
      setGoalInput("")
    }
  }

  const removeGoal = (index: number) => {
    setNetworkingGoals((prev) => prev.filter((_, i) => i !== index))
  }

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

  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests((prev) => [...prev, interest])
      setInterestInput("")
    }
  }

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest))
  }

  const addLocation = (location: string) => {
    if (location && !locations.includes(location)) {
      setLocations((prev) => [...prev, location])
      setLocationInput("")
    }
  }

  const removeLocation = (location: string) => {
    setLocations((prev) => prev.filter((l) => l !== location))
  }

  const addFilterSkill = (skill: string) => {
    if (skill && !filterSkills.includes(skill)) {
      setFilterSkills((prev) => [...prev, skill])
      setSkillInput("")
    }
  }

  const removeFilterSkill = (skill: string) => {
    setFilterSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleSave = () => {
    // In real app, save to database
    setSoulData({
      linkedinUrl,
      githubUrl,
      skills_possessed: skillsPossessed,
      skills_desired: skillsDesired,
      networking_goals: networkingGoals,
      raw_assets: {
        voice_snippet: vibeCheck,
        experience_log: experienceLog,
        project_list: projectList,
        interests,
      },
      filters: {
        locations,
        skills: filterSkills,
        experienceYears,
      },
    })
    // Show success message
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-secondary/50 w-full justify-start overflow-x-auto">
        <TabsTrigger value="documents" className="gap-2">
          <FileText className="w-4 h-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="skills" className="gap-2">
          <Code className="w-4 h-4" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="vibe" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Vibe Check
        </TabsTrigger>
        <TabsTrigger value="experience" className="gap-2">
          <Briefcase className="w-4 h-4" />
          Experience
        </TabsTrigger>
        <TabsTrigger value="interests" className="gap-2">
          <Heart className="w-4 h-4" />
          Interests
        </TabsTrigger>
        <TabsTrigger value="goals" className="gap-2">
          <Target className="w-4 h-4" />
          Goals
        </TabsTrigger>
        <TabsTrigger value="filters" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Documents & Links</CardTitle>
            <CardDescription>Update your LinkedIn, GitHub, and uploaded documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub URL
              </Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label>Uploaded Documents</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {soulData.documents?.length || 0} document(s) uploaded
                </p>
                {soulData.documents && soulData.documents.length > 0 ? (
                  <div className="space-y-2">
                    {soulData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{doc.name}</span>
                          <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="w-4 h-4" />
                Upload Documents
              </Button>
            </div>

            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skills" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>What skills do you have, and what skills are you looking for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Skills You Have</Label>
              </div>
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
                <Button onClick={() => addPossessedSkill(possessedInput)} variant="outline" className="bg-transparent">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsPossessed.map((skill) => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <button
                      onClick={() => removePossessedSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter((s) => !skillsPossessed.includes(s)).map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => addPossessedSkill(skill)}
                    className="bg-transparent text-xs"
                  >
                    + {skill}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Skills You're Looking For</Label>
              </div>
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
                <Button onClick={() => addDesiredSkill(desiredInput)} variant="outline" className="bg-transparent">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsDesired.map((skill) => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <button
                      onClick={() => removeDesiredSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter((s) => !skillsDesired.includes(s)).map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => addDesiredSkill(skill)}
                    className="bg-transparent text-xs"
                  >
                    + {skill}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vibe" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Voice Signature</CardTitle>
            <CardDescription>Your Doppel uses this to communicate in your voice and style.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vibeCheck">Vibe Check</Label>
              <Textarea
                id="vibeCheck"
                placeholder="Write naturally. We'll analyze your tone, word choice, and style so your Doppel sounds like you."
                value={vibeCheck}
                onChange={(e) => setVibeCheck(e.target.value)}
                className="min-h-[200px] bg-secondary/50 resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{vibeCheck.length} characters</span>
                <span>{vibeCheck.length >= 100 ? "Looking good!" : `${100 - vibeCheck.length} more to go`}</span>
              </div>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="experience" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Experience & Projects</CardTitle>
            <CardDescription>Share your work history and notable projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Experience</Label>
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="e.g., Senior Backend Engineer @ Stripe (2020-2023) - Core Payments Team. Led the migration of the legacy payment intents API..."
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
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Projects</Label>
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="e.g., Repo: rocket-rs (Rust) - A high performance, type-safe web server template designed for speed..."
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
            </div>

            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="interests" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Share your interests and hobbies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addInterest(interestInput)
                  }
                }}
                className="bg-secondary/50"
              />
              <Button onClick={() => addInterest(interestInput)} variant="outline" className="bg-transparent">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="outline" className="gap-1">
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INTERESTS.filter((i) => !interests.includes(i)).map((interest) => (
                  <Button
                    key={interest}
                    variant="outline"
                    size="sm"
                    onClick={() => addInterest(interest)}
                    className="bg-transparent text-xs"
                  >
                    + {interest}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="goals" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Networking Goals</CardTitle>
            <CardDescription>Describe what you're looking for in your connections. Be specific about your goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="e.g., Find a technical co-founder who has deep experience with Rust and distributed systems"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
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
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="filters" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Gatekeeper Filters</CardTitle>
            <CardDescription>Define hard requirements. Your Doppel won't waste time on connections that don't meet these criteria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Locations</Label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {locations.map((location) => (
                  <Badge key={location} variant="outline" className="gap-1">
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add location..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addLocation(locationInput)
                    }
                  }}
                  className="bg-secondary/50"
                />
                <Button onClick={() => addLocation(locationInput)} variant="outline" className="bg-transparent">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_LOCATIONS.filter((loc) => !locations.includes(loc)).map((location) => (
                  <Button
                    key={location}
                    variant="outline"
                    size="sm"
                    onClick={() => addLocation(location)}
                    className="bg-transparent text-xs"
                  >
                    + {location}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Required Skills</Label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {filterSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <button
                      onClick={() => removeFilterSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFilterSkill(skillInput)
                    }
                  }}
                  className="bg-secondary/50"
                />
                <Button onClick={() => addFilterSkill(skillInput)} variant="outline" className="bg-transparent">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter((skill) => !filterSkills.includes(skill)).map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => addFilterSkill(skill)}
                    className="bg-transparent text-xs"
                  >
                    + {skill}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Minimum Experience Years</Label>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="bg-secondary/50 w-32"
                />
                <p className="text-sm text-muted-foreground">
                  {experienceYears === 0 ? "No minimum requirement" : `At least ${experienceYears} years of experience`}
                </p>
              </div>
            </div>

            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
