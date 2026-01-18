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
  Bell,
  Shield,
  Camera,
  Briefcase,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [githubUrl, setGithubUrl] = useState("")
  
  // Agent settings
  const [agentActive, setAgentActive] = useState(true)
  const [selectiveConnect, setSelectiveConnect] = useState(false)
  const [vibeCheck, setVibeCheck] = useState("")
  const [networkingGoals, setNetworkingGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState("")
  
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

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
      }

      if (profile) {
        setName(profile.name || "")
        setHeadline(profile.tagline || "")
        setLocation(profile.location || "")
        setLinkedinUrl(profile.linkedin_url || "")
        setGithubUrl(profile.github_url || "")
        if (profile.email) setEmail(profile.email)
        
        // Load networking_goals from dedicated column (text[] in Postgres)
        if (profile.networking_goals && Array.isArray(profile.networking_goals)) {
          setNetworkingGoals(profile.networking_goals)
        }
        
        if (profile.persona) {
          setVibeCheck(profile.persona.voice_signature || "")
          setAgentActive(profile.persona.agent_active ?? true)
          setSelectiveConnect(profile.persona.selective_connect ?? false)
          
          if (profile.persona.notifications) {
            setEmailNotifications(profile.persona.notifications.email ?? true)
            setMatchAlerts(profile.persona.notifications.match_alerts ?? true)
            setWeeklyDigest(profile.persona.notifications.weekly_digest ?? false)
          }
        }
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
      const { error } = await supabase
        .from("users")
        .upsert({
          id: userId,
          name,
          tagline: headline,
          location,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          networking_goals: networkingGoals,
          persona: {
            voice_signature: vibeCheck,
            agent_active: agentActive,
            selective_connect: selectiveConnect,
            notifications: {
              email: emailNotifications,
              match_alerts: matchAlerts,
              weekly_digest: weeklyDigest,
            },
          },
        })

      if (error) {
        console.error("Error saving profile:", error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error("Error:", error)
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
        <TabsTrigger value="agent" className="gap-2">
          <Shield className="w-4 h-4" />
          Agent
        </TabsTrigger>
        <TabsTrigger value="experience" className="gap-2">
          <Briefcase className="w-4 h-4" />
          Experience
        </TabsTrigger>
        <TabsTrigger value="goals" className="gap-2">
          <Target className="w-4 h-4" />
          Goals
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>This is how others see you on Doppel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-xl">{getInitials(name || email)}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
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

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Voice Signature</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Write naturally so your Doppel can learn your communication style.
              </p>
              <Textarea
                placeholder="Write a few paragraphs about anything - your work, hobbies, opinions. We'll analyze your tone, word choice, and style so your Doppel sounds like you."
                value={vibeCheck}
                onChange={(e) => setVibeCheck(e.target.value)}
                className="min-h-[200px] bg-secondary/50 resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{vibeCheck.length} characters</span>
                <span>{vibeCheck.length >= 200 ? "Great sample!" : `${200 - vibeCheck.length} more characters recommended`}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Documents</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload your resume or other documents to help your Doppel understand your background.
              </p>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="w-4 h-4" />
                Upload Documents
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

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose how you want to be notified about activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1">
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1">
                <Label className="text-base font-medium">Match Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when your Doppel finds a great match</p>
              </div>
              <Switch checked={matchAlerts} onCheckedChange={setMatchAlerts} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1">
                <Label className="text-base font-medium">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">Receive a weekly summary of your networking activity</p>
              </div>
              <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
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
                "Save Notification Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
