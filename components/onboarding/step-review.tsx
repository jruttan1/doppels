"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, MessageCircle, Target, Heart, Loader2, Sparkles, Briefcase, MapPin } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface StepReviewProps {
  soulData: Partial<SoulFileData>
  onPrev: () => void
}

export function StepReview({ soulData, onPrev }: StepReviewProps) {
  const router = useRouter()
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployError(null)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("You must be logged in to continue")
      }
      
      // Call onboarding API to parse PDFs and save data
      const onboardRes = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          resumeBase64: soulData.resumeBase64 || null,
          linkedinBase64: soulData.linkedinBase64 || null,
          githubUrl: soulData.githubUrl || null,
          networkingGoals: soulData.networking_goals || [],
          voiceSignature: soulData.raw_assets?.voice_snippet || null,
          skills: soulData.raw_assets?.interests || [], // interests = skills
          skillsDesired: soulData.hiringSkillsDesired || [],
          locationDesired: soulData.hiringLocationsDesired || [],
        }),
      })
      
      const onboardData = await onboardRes.json()
      
      if (!onboardData.success) {
        throw new Error(onboardData.error || "Failed to save profile")
      }
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Deploy error:", error)
      setDeployError(error.message || "Failed to save profile")
      setIsDeploying(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Review
        </h1>
        <p className="text-white/50">
          Everything look good?
        </p>
      </div>

      <div className="space-y-6">
        {/* Documents */}
        {(soulData.documents && soulData.documents.length > 0) || soulData.linkedinUrl || soulData.githubUrl ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
            </div>
            <div className="space-y-2">
              {soulData.documents && soulData.documents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {soulData.documents.map((doc, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                    >
                      {doc.name}
                    </span>
                  ))}
                </div>
              )}
              {soulData.linkedinUrl && (
                <p className="text-sm text-white/50">LinkedIn: {soulData.linkedinUrl}</p>
              )}
              {soulData.githubUrl && (
                <p className="text-sm text-white/50">GitHub: {soulData.githubUrl}</p>
              )}
            </div>
          </div>
        ) : null}

        {/* Voice Signature */}
        {soulData.raw_assets?.voice_snippet && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Voice Signature</span>
            </div>
            <p className="text-sm text-white/60 italic line-clamp-3">
              &ldquo;{soulData.raw_assets.voice_snippet.slice(0, 200)}...&rdquo;
            </p>
          </div>
        )}

        {/* Interests */}
        {soulData.raw_assets?.interests && soulData.raw_assets.interests.length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
              <Heart className="w-3.5 h-3.5" />
              <span>Interests</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {soulData.raw_assets.interests.map((interest) => (
                <span 
                  key={interest} 
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Networking Goals */}
        {soulData.networking_goals && soulData.networking_goals.length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
              <Target className="w-3.5 h-3.5" />
              <span>Goals</span>
            </div>
            <div className="space-y-2">
              {soulData.networking_goals.map((goal, index) => (
                <p key={index} className="text-sm text-white/60">• {goal}</p>
              ))}
            </div>
          </div>
        )}

        {/* Hiring Preferences */}
        {soulData.isHiring && (soulData.hiringSkillsDesired?.length || soulData.hiringLocationsDesired?.length) ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Hiring Preferences</span>
            </div>
            <div className="space-y-4">
              {soulData.hiringSkillsDesired && soulData.hiringSkillsDesired.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-2">Skills wanted</p>
                  <div className="flex flex-wrap gap-2">
                    {soulData.hiringSkillsDesired.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {soulData.hiringLocationsDesired && soulData.hiringLocationsDesired.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Locations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {soulData.hiringLocationsDesired.map((location) => (
                      <span 
                        key={location} 
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {deployError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {deployError}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={onPrev} 
            className="gap-2 text-white/50 hover:text-white hover:bg-white/5" 
            disabled={isDeploying}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="gap-2 bg-white text-black hover:bg-white/90 border-0 h-12 px-8 min-w-[160px]"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Launch
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
