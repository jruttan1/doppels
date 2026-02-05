"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  FileText, 
  Github, 
  Linkedin, 
  MessageSquare, 
  Target, 
  X, 
  Upload, 
  MapPin, 
  Plus,
  Shield,
  Briefcase,
  Loader2,
  CheckCircle2,
  Calendar
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  headline: string | null
  location: string | null
  avatar_url: string | null
  linkedin_url: string | null
  github_url: string | null
  persona: {
    voice_signature?: string
    networking_goals?: string[]
    agent_active?: boolean
    selective_connect?: boolean
    notifications?: {
      email?: boolean
      match_alerts?: boolean
      weekly_digest?: boolean
    }
  } | null
}

export function SettingsView() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Profile data
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [headline, setHeadline] = useState("")
  const [location, setLocation] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [xUrl, setXUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState("")
  
  // Agent settings
  const [agentActive, setAgentActive] = useState(true)
  const [selectiveConnect, setSelectiveConnect] = useState(false)
  const [vibeCheck, setVibeCheck] = useState("")
  const [promptResponses, setPromptResponses] = useState<string[]>(["", "", ""])
  const [networkingGoals, setNetworkingGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState("")
  
  // Documents
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [linkedinFiles, setLinkedinFiles] = useState<File[]>([])
  const [isDraggingResume, setIsDraggingResume] = useState(false)
  const [isDraggingLinkedin, setIsDraggingLinkedin] = useState(false)
  
  // Skills
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  
  // Hiring preferences
  const [skillsDesired, setSkillsDesired] = useState<string[]>([])
  const [skillDesiredInput, setSkillDesiredInput] = useState("")
  const [locationDesired, setLocationDesired] = useState<string[]>([])
  const [locationDesiredInput, setLocationDesiredInput] = useState("")
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setEmail(user.email || "")

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Error fetching profile:", error)
        }
        // If user doesn't exist yet, that's okay - they'll start with empty fields
      }

      if (profile) {
        // Basic profile info
        setName(profile.name || "")
        setHeadline(profile.tagline || "")
        setLocation(profile.location || "")
        if (profile.email) setEmail(profile.email)
        
        // Social links - check both direct columns and persona
        setLinkedinUrl(profile.linkedin_url || profile.persona?.linkedin_url || "")
        setXUrl(profile.x_url || "")
        setGithubUrl(profile.github_url || "")
        setGoogleCalendarUrl(profile.google_calendar_url || "")
        
        // Helper to parse array fields (handle both array and JSON string formats)
        const parseArrayField = (field: any): string[] => {
          if (!field) return []
          if (Array.isArray(field)) return field
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              // If it's a comma-separated string, split it
              if (field.includes(',')) {
                return field.split(',').map(s => s.trim()).filter(Boolean)
              }
              return []
            }
          }
          return []
        }
        
        // Load networking_goals - check column first, then persona
        const goalsFromDb = parseArrayField(profile.networking_goals)
        const goalsFromPersona = parseArrayField(profile.persona?.networking_goals)
        if (goalsFromDb.length > 0) {
          setNetworkingGoals(goalsFromDb)
        } else if (goalsFromPersona.length > 0) {
          setNetworkingGoals(goalsFromPersona)
        }
        
        // Load skills - check column first, then persona.skills_possessed, then persona.skills
        const skillsFromDb = parseArrayField(profile.skills)
        const skillsFromPersona = parseArrayField(profile.persona?.skills_possessed || profile.persona?.skills)
        if (skillsFromDb.length > 0) {
          setSkills(skillsFromDb)
        } else if (skillsFromPersona.length > 0) {
          setSkills(skillsFromPersona)
        }
        
        // Load hiring preferences - check column first
        const skillsDesiredFromDb = parseArrayField(profile.skills_desired)
        const skillsDesiredFromPersona = parseArrayField(profile.persona?.skills_desired)
        if (skillsDesiredFromDb.length > 0) {
          setSkillsDesired(skillsDesiredFromDb)
        } else if (skillsDesiredFromPersona.length > 0) {
          setSkillsDesired(skillsDesiredFromPersona)
        }
        
        const locationDesiredFromDb = parseArrayField(profile.location_desired)
        const locationDesiredFromPersona = parseArrayField(profile.persona?.location_desired || profile.persona?.filters?.locations)
        if (locationDesiredFromDb.length > 0) {
          setLocationDesired(locationDesiredFromDb)
        } else if (locationDesiredFromPersona.length > 0) {
          setLocationDesired(locationDesiredFromPersona)
        }
        
        // Load voice signature - check column first, then persona
        let voiceSignature = ""
        if (profile.voice_signature) {
          voiceSignature = profile.voice_signature
        } else if (profile.persona?.raw_assets?.voice_snippet) {
          voiceSignature = profile.persona.raw_assets.voice_snippet
        } else if (profile.persona?.voice_signature) {
          voiceSignature = profile.persona.voice_signature
        }
        setVibeCheck(voiceSignature)
        // Parse into 3 prompts (split by "\n\n---\n\n")
        if (voiceSignature) {
          const prompts = voiceSignature.split("\n\n---\n\n")
          setPromptResponses([
            prompts[0] || "",
            prompts[1] || "",
            prompts[2] || ""
          ])
        } else {
          // Initialize empty prompts if no data
          setPromptResponses(["", "", ""])
        }
        
        // Load agent settings from persona (with defaults)
        if (profile.persona) {
          setAgentActive(profile.persona.agent_active ?? true)
          setSelectiveConnect(profile.persona.selective_connect ?? false)
          
          if (profile.persona.notifications) {
            setEmailNotifications(profile.persona.notifications.email ?? true)
            setMatchAlerts(profile.persona.notifications.match_alerts ?? true)
            setWeeklyDigest(profile.persona.notifications.weekly_digest ?? false)
          }
        } else {
          // Set defaults if no persona exists
          setAgentActive(true)
          setSelectiveConnect(false)
        }
      } else {
        // No profile found - set defaults
        setAgentActive(true)
        setSelectiveConnect(false)
        setPromptResponses(["", "", ""])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleSave = async () => {
    if (!userId) return
    
    setSaving(true)
    setSaved(false)

    try {
      // First fetch existing persona to preserve generated data
      const { data: existing } = await supabase
        .from("users")
        .select("persona")
        .eq("id", userId)
        .single()
      
      const existingPersona = existing?.persona || {}
      
      // Prepare data with proper types - only include fields that have values
      const updateData: any = {
        id: userId,
      }

      // Only include fields that have values (avoid sending empty strings)
      if (name) updateData.name = name
      if (headline) updateData.tagline = headline
      if (location) updateData.location = location
      if (linkedinUrl) updateData.linkedin_url = linkedinUrl
      if (xUrl) updateData.x_url = xUrl
      if (githubUrl) updateData.github_url = githubUrl
      if (googleCalendarUrl) updateData.google_calendar_url = googleCalendarUrl
      
      const voiceSig = promptResponses.join("\n\n---\n\n")
      if (voiceSig.trim()) updateData.voice_signature = voiceSig

      // Handle array fields - always send as arrays (even if empty)
      updateData.networking_goals = networkingGoals.length > 0 ? networkingGoals : []
      updateData.skills = skills.length > 0 ? skills : []
      updateData.skills_desired = skillsDesired.length > 0 ? skillsDesired : []
      updateData.location_desired = locationDesired.length > 0 ? locationDesired : []

      // Update persona with agent settings
      updateData.persona = {
        ...existingPersona,
        agent_active: agentActive,
        selective_connect: selectiveConnect,
        notifications: {
          email: emailNotifications,
          match_alerts: matchAlerts,
          weekly_digest: weeklyDigest,
        },
      }

      // Try update first (user should already exist)
      let { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)

      // If update fails with "no rows" error, try upsert (user might not exist yet)
      if (error && error.code === "PGRST116") {
        const { error: upsertError } = await supabase
          .from("users")
          .upsert(updateData)
        error = upsertError
      }

      if (error) {
        console.error("Error saving profile:", error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)
        console.error("Data being saved:", JSON.stringify(updateData, null, 2))
        alert(`Failed to save settings: ${error.message || 'Unknown error'}. Check console for details.`)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Refresh profile data to ensure UI is in sync
        await fetchProfile()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while saving. Please try again.")
    } finally {
      setSaving(false)
    }
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

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills((prev) => [...prev, skillInput.trim()])
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const addSkillDesired = () => {
    if (skillDesiredInput.trim() && !skillsDesired.includes(skillDesiredInput.trim())) {
      setSkillsDesired((prev) => [...prev, skillDesiredInput.trim()])
      setSkillDesiredInput("")
    }
  }

  const removeSkillDesired = (skill: string) => {
    setSkillsDesired((prev) => prev.filter((s) => s !== skill))
  }

  const addLocationDesired = () => {
    if (locationDesiredInput.trim() && !locationDesired.includes(locationDesiredInput.trim())) {
      setLocationDesired((prev) => [...prev, locationDesiredInput.trim()])
      setLocationDesiredInput("")
    }
  }

  const removeLocationDesired = (loc: string) => {
    setLocationDesired((prev) => prev.filter((l) => l !== loc))
  }

  // Voice signature prompts (matching onboarding)
  const VIBE_CHECK_PROMPTS = [
    "Write a message to a potential co-founder you've never met.",
    "Describe your perfect weekend side project.",
    "How would you explain your work to a smart 10-year-old?",
  ]

  const handlePromptChange = (index: number, value: string) => {
    const newResponses = [...promptResponses]
    newResponses[index] = value
    setPromptResponses(newResponses)
    // Also update combined vibeCheck for backward compatibility
    setVibeCheck(newResponses.join("\n\n---\n\n"))
  }

  // Document upload handlers
  const handleDragOver = (e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(true)
    else setIsDraggingLinkedin(true)
  }

  const handleDragLeave = (e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(false)
    else setIsDraggingLinkedin(false)
  }

  const handleDrop = (e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(false)
    else setIsDraggingLinkedin(false)
    
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf" || file.type.includes("document"),
    )
    
    if (type === "resume") {
      setResumeFiles((prev) => [...prev, ...files])
    } else {
      setLinkedinFiles((prev) => [...prev, ...files])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "linkedin") => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (type === "resume") {
        setResumeFiles((prev) => [...prev, ...files])
      } else {
        setLinkedinFiles((prev) => [...prev, ...files])
      }
    }
  }

  const removeFile = (index: number, type: "resume" | "linkedin") => {
    if (type === "resume") {
      setResumeFiles((prev) => prev.filter((_, i) => i !== index))
    } else {
      setLinkedinFiles((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Tabs value={activeTab || "profile"} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-secondary/50 w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="profile" className="gap-2">
          <User className="w-4 h-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="skills" className="gap-2">
          <FileText className="w-4 h-4" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="hiring" className="gap-2">
          <Briefcase className="w-4 h-4" />
          Hiring
        </TabsTrigger>
        <TabsTrigger value="agent" className="gap-2">
          <Shield className="w-4 h-4" />
          Agent
        </TabsTrigger>
        <TabsTrigger value="goals" className="gap-2">
          <Target className="w-4 h-4" />
          Goals
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>This is how others see you on s.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-xl">{getInitials(name || email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{name || "Add your name"}</h3>
                <p className="text-sm text-muted-foreground truncate">{headline || "Add a headline"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{location || "Add location"}</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-secondary/50 opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g., Senior Software Engineer at Stripe"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <Separator />

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-medium">Social Links</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
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
                    GitHub
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
                <div className="space-y-2">
                  <Label htmlFor="google-calendar" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Google Calendar
                  </Label>
                  <Input
                    id="google-calendar"
                    type="url"
                    placeholder="https://calendar.google.com/..."
                    value={googleCalendarUrl}
                    onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Skills Tab */}
      <TabsContent value="skills" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
            <CardDescription>Skills you have - used for matching with others.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Current Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Skill */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., React, Python, Product Management)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                className="bg-secondary/50"
              />
              <Button onClick={addSkill} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Skills"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Hiring Tab */}
      <TabsContent value="hiring" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Hiring Preferences</CardTitle>
            <CardDescription>Looking for a co-founder or hiring? Specify what you're looking for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skills Desired */}
            <div className="space-y-3">
              <Label>Skills you're looking for</Label>
              {skillsDesired.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skillsDesired.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkillDesired(skill)}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g., Backend, ML, Sales)"
                  value={skillDesiredInput}
                  onChange={(e) => setSkillDesiredInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkillDesired()
                    }
                  }}
                  className="bg-secondary/50"
                />
                <Button onClick={addSkillDesired} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Locations Desired */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Preferred Locations
              </Label>
              {locationDesired.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {locationDesired.map((loc) => (
                    <span 
                      key={loc} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm"
                    >
                      {loc}
                      <button
                        onClick={() => removeLocationDesired(loc)}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a location (e.g., San Francisco, Remote)"
                  value={locationDesiredInput}
                  onChange={(e) => setLocationDesiredInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addLocationDesired()
                    }
                  }}
                  className="bg-secondary/50"
                />
                <Button onClick={addLocationDesired} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Hiring Preferences"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Agent Tab */}
      <TabsContent value="agent" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Agent Settings</CardTitle>
            <CardDescription>Control how your Doppel behaves and represents you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1">
                <Label className="text-base font-medium">Agent Status</Label>
                <p className="text-sm text-muted-foreground">
                  {agentActive ? "Your Doppel is actively networking for you" : "Your Doppel is paused"}
                </p>
              </div>
              <Switch checked={agentActive} onCheckedChange={setAgentActive} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1">
                <Label className="text-base font-medium">Selective Connect</Label>
                <p className="text-sm text-muted-foreground">
                  Only connect with the highest scoring matches.
                </p>
              </div>
              <Switch checked={selectiveConnect} onCheckedChange={setSelectiveConnect} />
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Voice Signature</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Write naturally so your Doppel sounds like you.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Complete at least the first question. Additional questions are optional.
              </p>
              
              {VIBE_CHECK_PROMPTS.map((prompt, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{prompt}</p>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground/60 px-2 py-0.5 rounded-full bg-secondary border border-border">
                        Optional
                      </span>
                    )}
                  </div>
                  <Textarea
                    placeholder="Start typing how you'd actually write..."
                    value={promptResponses[index] || ""}
                    onChange={(e) => handlePromptChange(index, e.target.value)}
                    className="min-h-[160px] bg-secondary/50 resize-none"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{promptResponses[index]?.length || 0} characters</span>
                    {index === 0 ? (
                      <span>
                        {(promptResponses[index]?.length || 0) >= 100
                          ? "✓ Good"
                          : `${100 - (promptResponses[index]?.length || 0)} more`}
                      </span>
                    ) : (
                      <span>
                        {(promptResponses[index]?.length || 0) >= 100 ? "✓ Good" : "Optional"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total characters</span>
                  <span className="font-mono">
                    {promptResponses.reduce((sum, r) => sum + (r?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Documents</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add your resume and profiles for better matches.
              </p>
              
              {/* Resume Upload */}
              <div className="space-y-3">
                <Label className="text-sm">Resume / Documents</Label>
                <div
                  onDragOver={(e) => handleDragOver(e, "resume")}
                  onDragLeave={(e) => handleDragLeave(e, "resume")}
                  onDrop={(e) => handleDrop(e, "resume")}
                  onClick={() => document.getElementById("resume-input")?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDraggingResume ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    id="resume-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, "resume")}
                    multiple
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX up to 10MB</p>
                </div>
                {resumeFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resumeFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm">
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index, "resume")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LinkedIn PDF Upload */}
              <div className="space-y-3">
                <Label className="text-sm flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile (PDF)
                </Label>
                <div
                  onDragOver={(e) => handleDragOver(e, "linkedin")}
                  onDragLeave={(e) => handleDragLeave(e, "linkedin")}
                  onDrop={(e) => handleDrop(e, "linkedin")}
                  onClick={() => document.getElementById("linkedin-input")?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDraggingLinkedin ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    id="linkedin-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, "linkedin")}
                    multiple
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your LinkedIn PDF here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF up to 10MB</p>
                </div>
                {linkedinFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedinFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm">
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index, "linkedin")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Agent Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Experience Tab */}
      <TabsContent value="experience" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>New experience or projects? upload your resume, we'll do the rest ;)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg bg-secondary/20">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Drag and drop your resume here, or click to browse</p>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Resume
              </Button>
              <p className="text-xs text-muted-foreground mt-3">PDF, DOC, or DOCX up to 10MB</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Goals Tab */}
      <TabsContent value="goals" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Networking Goals</CardTitle>
            <CardDescription>What are you looking to achieve? Be specific so your Doppel can find the right connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instructions */}
            <div className="rounded-lg bg-secondary/30 border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Be specific about who you want to meet. The more detail, the better we can match you.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Examples: "A technical co-founder with backend experience in fintech" or "Angel investors focused on AI/ML startups"
              </p>
            </div>

            {/* Goals list */}
            {networkingGoals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Your goals</span>
                  <span className="text-xs text-muted-foreground">{networkingGoals.length} added</span>
                </div>
                <div className="space-y-2">
                  {networkingGoals.map((goal, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border"
                    >
                      <span className="text-muted-foreground text-sm font-mono">{index + 1}.</span>
                      <p className="flex-1 text-sm">{goal}</p>
                      <button
                        onClick={() => removeGoal(index)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
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
              <Textarea
                placeholder="Describe a networking goal..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    addGoal()
                  }
                }}
                rows={3}
                className="bg-secondary/50 resize-none"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Add more goals if you'd like
                </span>
                <Button
                  onClick={addGoal}
                  disabled={!goalInput.trim()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Goal
                </Button>
              </div>
            </div>
            {networkingGoals.length > 0 ? (
              <div className="space-y-2">
                {networkingGoals.map((goal, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                    <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="flex-1 text-sm">{goal}</p>
                    <button onClick={() => removeGoal(index)} className="p-1 hover:bg-secondary rounded">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No goals added yet</p>
                <p className="text-sm">Add your networking goals to help your Doppel find the right connections</p>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Goals"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  )
}
