"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Mail, Linkedin, ExternalLink, Sparkles, Target, Users, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ConnectionPreview {
  id: string
  name: string
  role: string
  avatar: string
  compatibility: number
  icebreaker: string
  status: "matched" | "connected"
  matchedAt: string
  simulationId?: string
}

interface ConnectionDetailModalProps {
  connection: ConnectionPreview | null
  onClose: () => void
  onViewSimulation?: (simulationId: string) => void
}

export function ConnectionDetailModal({ connection, onClose }: ConnectionDetailModalProps) {
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [talkingPoints, setTalkingPoints] = useState<string[]>([])
  const [sendingCoffeeChat, setSendingCoffeeChat] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState<string | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null)
  const supabase = createClient()

  const handleReachOut = async () => {
    const simId = connection?.simulationId || simulationId

    if (!simId) {
      setCoffeeChatSent("No simulation found for this connection")
      return
    }

    setSendingCoffeeChat(true)
    setCoffeeChatSent(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/send-coffee-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simId, senderId: user.id })
      })

      const result = await response.json()

      if (!response.ok) {
        setCoffeeChatSent(result.error || "Failed to get contact info")
        return
      }

      const subject = encodeURIComponent(
        `Intro via Doppels: ${result.senderName} <> ${result.receiverName}`
      )
      const body = encodeURIComponent(
        `Hey ${result.receiverFirstName},\n\n` +
        `My AI agent just ran a simulation with yours on Doppels.\n` +
        `It flagged our conversation as a ${result.score}% match` +
        ` (specifically regarding ${result.topTakeaway}).\n\n` +
        `The transcript looked interesting, so I wanted to reach out directly.\n\n` +
        `Best,\n${result.senderName}\n(Sent via Doppels)`
      )

      window.location.href = `mailto:${result.receiverEmail}?subject=${subject}&body=${body}`
    } catch (error) {
      setCoffeeChatSent("Failed to prepare email")
    } finally {
      setSendingCoffeeChat(false)
    }
  }

  // Reset state when connection changes
  useEffect(() => {
    if (connection) {
      setSimulationId(null)
      setTalkingPoints([])
      setCoffeeChatSent(null)
      setLinkedinUrl(null)

      const findSimulation = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Fetch the connection's LinkedIn URL
          const { data: connectionUser } = await supabase
            .from('users')
            .select('linkedin_url')
            .eq('id', connection.id)
            .single()

          if (connectionUser?.linkedin_url) {
            setLinkedinUrl(connectionUser.linkedin_url)
          }

          // Try to find simulation where current user is participant1
          let { data: sim } = await supabase
            .from('simulations')
            .select('id, takeaways')
            .eq('participant1', user.id)
            .eq('participant2', connection.id)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle()

          // If not found, try reverse order
          if (!sim) {
            const { data: simReverse } = await supabase
              .from('simulations')
              .select('id, takeaways')
              .eq('participant1', connection.id)
              .eq('participant2', user.id)
              .order('score', { ascending: false })
              .limit(1)
              .maybeSingle()
            sim = simReverse
          }

          if (sim) {
            setSimulationId(sim.id)
            if (sim.takeaways && Array.isArray(sim.takeaways)) {
              setTalkingPoints(sim.takeaways)
            } else {
              setTalkingPoints([])
            }
          }
        } catch (error) {
          console.error("Error finding simulation:", error)
        }
      }
      findSimulation()
    }
  }, [connection?.id, supabase])

  if (!connection) return null

  const scores = {
    relevance: Math.min(95, connection.compatibility + 3),
    reciprocity: Math.min(90, connection.compatibility - 5),
    toneMatch: Math.min(98, connection.compatibility + 8),
  }

  return (
    <Dialog
      open={!!connection}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-lg bg-card border-border shadow-lg h-[calc(100vh-3.5rem)] w-full max-h-[calc(100vh-3.5rem)] mt-14 sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-lg sm:mt-0 flex flex-col min-h-0 p-0 sm:p-6 rounded-lg !fixed !top-14 !left-0 !right-0 !bottom-0 sm:!inset-auto sm:!top-[50%] sm:!left-[50%] !translate-x-0 !translate-y-0 sm:!translate-x-[-50%] sm:!translate-y-[-50%] !z-[60] overflow-hidden">
        <DialogClose className="absolute top-4 right-12 sm:right-4 z-[70] rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 size-8 flex items-center justify-center" aria-label="Close">
          <X className="size-4" />
        </DialogClose>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pr-12 sm:px-0 sm:pr-6 pb-4 sm:pb-0 min-w-0" style={{ scrollbarGutter: "stable" }}>
          <DialogHeader className="pt-6 sm:pt-0 shrink-0">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {connection.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-card flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <DialogTitle className="text-xl truncate">{connection.name}</DialogTitle>
                <DialogDescription className="text-sm truncate">{connection.role}</DialogDescription>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 shrink-0">
                    {connection.compatibility}% Match
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{connection.matchedAt}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
          {/* Compatibility Breakdown */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Compatibility Breakdown
            </h4>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 min-w-0">
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">Relevance</span>
                  <span className="shrink-0">{scores.relevance}%</span>
                </div>
                <Progress value={scores.relevance} className="h-2 w-full" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">Reciprocity</span>
                  <span className="shrink-0">{scores.reciprocity}%</span>
                </div>
                <Progress value={scores.reciprocity} className="h-2 w-full" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">Tone Match</span>
                  <span className="shrink-0">{scores.toneMatch}%</span>
                </div>
                <Progress value={scores.toneMatch} className="h-2 w-full" />
              </div>
            </div>
          </div>

          {/* Talking Points */}
          {talkingPoints.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Talking Points
              </h4>
              <ul className="space-y-2">
                {talkingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {coffeeChatSent && (
            <div className={`p-3 rounded-lg text-sm ${coffeeChatSent.includes("Failed") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
              {coffeeChatSent}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 min-w-0 w-full">
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-0 shrink-0"
              onClick={handleReachOut}
              disabled={sendingCoffeeChat}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{sendingCoffeeChat ? "Preparing..." : "Reach Out"}</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 pb-4 sm:pb-0">
            {linkedinUrl ? (
              <a
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <Linkedin className="w-4 h-4" />
                  View LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground/50 gap-2" disabled>
                <Linkedin className="w-4 h-4" />
                No LinkedIn
              </Button>
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
