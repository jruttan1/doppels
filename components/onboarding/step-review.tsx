"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Rocket, FileText, MessageCircle, Target, Filter, Loader2 } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepReviewProps {
  soulData: Partial<SoulFileData>
  onPrev: () => void
}

export function StepReview({ soulData, onPrev }: StepReviewProps) {
  const router = useRouter()
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeploy = async () => {
    setIsDeploying(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Ready to Deploy</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Review Your Soul File</h1>
        <p className="text-muted-foreground">
          Make sure everything looks good. Once deployed, your Doppel will start networking for you.
        </p>
      </div>

      <div className="space-y-4">
        {/* Documents */}
        {(soulData.documents && soulData.documents.length > 0) || soulData.linkedinUrl || soulData.githubUrl ? (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                Documents & Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {soulData.documents && soulData.documents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {soulData.documents.map((doc, i) => (
                    <Badge key={i} variant="secondary">
                      {doc.name}
                    </Badge>
                  ))}
                </div>
              )}
              {soulData.linkedinUrl && <p className="text-sm text-muted-foreground">LinkedIn: {soulData.linkedinUrl}</p>}
              {soulData.githubUrl && <p className="text-sm text-muted-foreground">GitHub: {soulData.githubUrl}</p>}
            </CardContent>
          </Card>
        ) : null}

        {/* Skills */}
        {((soulData.skills_possessed && soulData.skills_possessed.length > 0) || (soulData.skills_desired && soulData.skills_desired.length > 0)) && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {soulData.skills_possessed && soulData.skills_possessed.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Skills You Have</p>
                  <div className="flex flex-wrap gap-1">
                    {soulData.skills_possessed.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {soulData.skills_desired && soulData.skills_desired.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Skills You're Looking For</p>
                  <div className="flex flex-wrap gap-1">
                    {soulData.skills_desired.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Voice Signature */}
        {soulData.raw_assets?.voice_snippet && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                Voice Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground line-clamp-3">
                &ldquo;{soulData.raw_assets.voice_snippet.slice(0, 200)}...&rdquo;
              </p>
            </CardContent>
          </Card>
        )}

        {/* Experience & Projects */}
        {((soulData.raw_assets?.experience_log && soulData.raw_assets.experience_log.length > 0) || (soulData.raw_assets?.project_list && soulData.raw_assets.project_list.length > 0)) && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                Experience & Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {soulData.raw_assets?.experience_log && soulData.raw_assets.experience_log.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Experience ({soulData.raw_assets.experience_log.length})</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {soulData.raw_assets.experience_log[0]}
                  </p>
                </div>
              )}
              {soulData.raw_assets?.project_list && soulData.raw_assets.project_list.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Projects ({soulData.raw_assets.project_list.length})</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {soulData.raw_assets.project_list[0]}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {soulData.raw_assets?.interests && soulData.raw_assets.interests.length > 0 && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {soulData.raw_assets.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Networking Goals */}
        {soulData.networking_goals && soulData.networking_goals.length > 0 && (
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                Networking Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {soulData.networking_goals.map((goal, index) => (
                  <p key={index} className="text-sm text-muted-foreground">• {goal}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              Gatekeeper Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {soulData.filters?.locations && soulData.filters.locations.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Locations</p>
                <div className="flex flex-wrap gap-1">
                  {soulData.filters.locations.map((loc) => (
                    <Badge key={loc} variant="outline" className="text-xs">
                      {loc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {soulData.filters?.skills && soulData.filters.skills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {soulData.filters.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {soulData.filters?.experienceYears !== undefined && soulData.filters.experienceYears > 0 && (
              <p className="text-sm">
                Minimum experience: <span className="font-medium">{soulData.filters.experienceYears}+ years</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev} className="gap-2 bg-transparent" disabled={isDeploying}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Deploy Your Doppel
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
