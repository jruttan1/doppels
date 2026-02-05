"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, CheckCircle2, XCircle, Clock, ArrowRight, Mail, Loader2, Users } from "lucide-react"
import { ConnectionDetailModal } from "./connection-detail-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

interface Simulation {
  id: string
  targetName: string
  targetRole: string
  targetAvatar?: string
  status: "completed" | "in_progress" | "failed"
  score?: number
  startedAt: string
  completedAt?: string
  takeaways: string[]
  summary?: string
}

export function ConnectionsSimulationsSidebar() {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionPreview | null>(null)
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)
  const [activeTab, setActiveTab] = useState<"connections" | "simulations">("connections")
  const [connections, setConnections] = useState<ConnectionPreview[]>([])
  const [simulationsLoaded, setSimulationsLoaded] = useState(false);
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [currentUserName, setCurrentUserName] = useState<string>("You")
  const [sendingCoffeeChat, setSendingCoffeeChat] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState<string | null>(null)
  const supabase = createClient()

  const handleReachOut = async (simulationId: string) => {
    setSendingCoffeeChat(true)
    setCoffeeChatSent(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/send-coffee-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId, senderId: user.id })
      })

      const result = await response.json()

      if (!response.ok) {
        setCoffeeChatSent(result.error || "Failed to get contact info")
        return
      }

      const subject = encodeURIComponent(
        `Intro via Doppel: ${result.senderName} <> ${result.receiverName}`
      )
      const body = encodeURIComponent(
        `Hey ${result.receiverFirstName},\n\n` +
        `My AI agent just ran a simulation with yours on Doppel.\n` +
        `It flagged our conversation as a ${result.score}% match` +
        ` (specifically regarding ${result.topTakeaway}).\n\n` +
        `The transcript looked interesting, so I wanted to reach out directly.\n\n` +
        `Best,\n${result.senderName}\n(Sent via Doppel)`
      )

      window.location.href = `mailto:${result.receiverEmail}?subject=${subject}&body=${body}`
    } catch (error) {
      setCoffeeChatSent("Failed to prepare email")
    } finally {
      setSendingCoffeeChat(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch current user's name for avatar
        const { data: currentUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()

        if (currentUser?.name) {
          setCurrentUserName(currentUser.name)
        }

        // Fetch all simulations (both directions - user as participant1 OR participant2)
        const { data: sims1, error: error1 } = await supabase
          .from('simulations')
          .select('id, participant1, participant2, score, status, takeaways')
          .eq('participant1', user.id)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(50)

        const { data: sims2, error: error2 } = await supabase
          .from('simulations')
          .select('id, participant1, participant2, score, status, takeaways')
          .eq('participant2', user.id)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(50)

        const simError = error1 || error2
        if (simError) {
          console.error("Error fetching simulations:", simError)
          setConnections([])
          setSimulations([])
          setSimulationsLoaded(true)
          return
        }

        // Normalize: always extract the "other" participant as partnerId
        const normalizedSims = [
          ...(sims1 || []).map(s => ({ ...s, partnerId: s.participant2 })),
          ...(sims2 || []).map(s => ({ ...s, partnerId: s.participant1 }))
        ]

        // Deduplicate by partner ID - keep the highest score simulation for each partner
        const seenPartners = new Set<string>()
        const simsData = normalizedSims
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .filter(s => {
            if (seenPartners.has(s.partnerId)) return false
            seenPartners.add(s.partnerId)
            return true
          })

        if (simsData.length === 0) {
          setConnections([])
          setSimulations([])
          setSimulationsLoaded(true)
          return
        }

        // Fetch user details
        const userIds = [...new Set(simsData.map(s => s.partnerId))]
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, tagline, persona')
          .in('id', userIds)

        if (usersError || !users) {
          return
        }

        const userMap = new Map(users.map(u => [u.id, u]))

        // Build connections (completed with score >= 70)
        const connectionsList: ConnectionPreview[] = simsData
          .filter(s => (s as any).status === 'completed' && s.score && s.score >= 70)
          .map((sim) => {
            const user = userMap.get(sim.partnerId)
            const persona = user?.persona as any
            const identity = persona?.identity || {}
            const tagline = user?.tagline || ""
            const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
            const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
            const roleText = company ? `${role} @ ${company}` : role

            const takeaways = (sim.takeaways as string[] | null) || []
            const icebreaker = takeaways.length > 0
              ? takeaways[0].substring(0, 120) + (takeaways[0].length > 120 ? "..." : "")
              : `${sim.score}% compatibility match`

            const matchedAt = "Just now"

            return {
              id: user?.id || sim.partnerId,
              name: user?.name || "Unknown",
              role: roleText,
              avatar: "",
              compatibility: sim.score || 0,
              icebreaker,
              status: "matched" as const,
              matchedAt,
              simulationId: sim.id,
            }
          })

        // Build simulations list
        const simulationsList: Simulation[] = simsData.map((sim) => {
          const user = userMap.get(sim.partnerId)
          const persona = user?.persona as any
          const identity = persona?.identity || {}
          const tagline = user?.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          const roleText = company ? `${role} @ ${company}` : role

          const startedAt = "Just now"

          return {
            id: sim.id,
            targetName: user?.name || "Unknown",
            targetRole: roleText,
            targetAvatar: undefined,
            status: (sim as any).status === 'completed' ? "completed"
              : (sim as any).status === 'failed' ? "failed"
              : (sim as any).status === 'running' ? "in_progress"
              : sim.score !== null && sim.score !== undefined ? "completed"
              : "in_progress",
            score: sim.score ?? undefined,
            startedAt,
            completedAt: sim.score !== null ? startedAt : undefined,
            takeaways: (sim.takeaways as string[] | null) || [],
            summary: sim.score && sim.score >= 70 ? "High compatibility match" : undefined,
          }
        })

        setConnections(connectionsList)
        setSimulations(simulationsList)
        setSimulationsLoaded(true)
      } catch (error) {
        setSimulationsLoaded(true)
      }
    }

    fetchData()

    // Poll for new simulations every 10 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 10000)

    // Refresh when a simulation completes (small delay to ensure DB write propagates)
    const handleSimCompleted = () => setTimeout(() => fetchData(), 1000)
    window.addEventListener("simulation-completed", handleSimCompleted)

    return () => {
      clearInterval(interval)
      window.removeEventListener("simulation-completed", handleSimCompleted)
    }
  }, [supabase])

  const matchedConnections = connections.filter((c) => c.status === "matched")
  const connectedConnections = connections.filter((c) => c.status === "connected")

  const getStatusIcon = (status: Simulation["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3 h-3 text-teal-500" />
      case "in_progress":
        return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />
      case "failed":
        return <XCircle className="w-3 h-3 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: Simulation["status"], score?: number) => {
    switch (status) {
      case "completed":
        if (score !== undefined && score !== null) {
          return (
            <Badge className={score >= 70 ? "bg-teal-500/10 text-teal-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
              {score}%
            </Badge>
          )
        }
        return <Badge variant="secondary" className="text-xs">Done</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-500/10 text-yellow-500 text-xs animate-pulse">Running</Badge>
      case "failed":
        return <Badge variant="secondary" className="text-destructive/70 text-xs">Failed</Badge>
    }
  }

  // Show loader while initially loading
  if (!simulationsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading simulations...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <TabsList className="w-full bg-secondary/50">
              <TabsTrigger value="connections" className="flex-1 text-xs">
                Connections ({connections.length})
              </TabsTrigger>
              <TabsTrigger value="simulations" className="flex-1 text-xs">
                All Simulations ({simulations.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="connections" className="flex-1 mt-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full min-h-0">
              <div className="divide-y divide-border pb-4">
                {matchedConnections.map((connection) => (
                  <button
                    key={connection.id}
                    type="button"
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedConnection(connection)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {connection.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-card flex items-center justify-center">
                          <Sparkles className="w-1.5 h-1.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="font-medium text-xs truncate min-w-0">{connection.name}</p>
                          <Badge variant="outline" className="shrink-0 text-teal-500 border-teal-500/30 text-[10px] px-1.5 py-0">
                            {connection.compatibility}%
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-3 break-words">{connection.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-4 break-words">{connection.icebreaker}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {connectedConnections.map((connection) => (
                  <button
                    key={connection.id}
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {connection.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="font-medium text-xs truncate min-w-0">{connection.name}</p>
                          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                            Connected
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 break-words">{connection.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{connection.matchedAt}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="simulations" className="flex-1 mt-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full min-h-0">
              <div className="divide-y divide-border pb-4">
                {simulations.map((simulation) => (
                  <button
                    key={simulation.id}
                    type="button"
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedSimulation(simulation)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={simulation.targetAvatar || "/placeholder.svg?height=32&width=32&query=professional headshot"}
                          />
                          <AvatarFallback className="text-xs">
                            {simulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">{getStatusIcon(simulation.status)}</div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="font-medium text-xs truncate min-w-0">{simulation.targetName}</p>
                          {getStatusBadge(simulation.status, simulation.score)}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 break-words">{simulation.targetRole}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{simulation.startedAt}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <ConnectionDetailModal
        connection={selectedConnection}
        onClose={() => {
          setSelectedConnection(null)
        }}
      />

      {/* Simulation detail dialog — profile + takeaways only */}
      <Dialog
        open={!!selectedSimulation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSimulation(null)
            setCoffeeChatSent(null)
          }
        }}
        key={selectedSimulation?.id}
      >
        <DialogContent className="max-w-lg bg-card border-border shadow-lg h-[95vh] w-[95vw] max-h-[95vh] sm:h-auto sm:max-h-[85vh] sm:w-auto sm:max-w-lg flex flex-col min-h-0 p-0 rounded-lg z-100 overflow-hidden">
          {selectedSimulation ? (
            <>
              {/* Header */}
              <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-border shrink-0 min-w-0">
                <DialogHeader>
                  <DialogTitle className="sr-only">Simulation: {selectedSimulation.targetName}</DialogTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0 shrink-0">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm font-semibold">
                            {currentUserName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold truncate">Your Agent</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{currentUserName}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-3 min-w-0 shrink-0">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                          <AvatarImage
                            src={
                              selectedSimulation.targetAvatar ||
                              "/placeholder.svg?height=48&width=48&query=professional headshot"
                            }
                          />
                          <AvatarFallback className="text-xs sm:text-sm">
                            {selectedSimulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs sm:text-sm font-semibold truncate">{selectedSimulation.targetName}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{selectedSimulation.targetRole}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(selectedSimulation.status, selectedSimulation.score)}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Takeaways */}
              <div className="flex-1 overflow-y-auto min-h-0 min-w-0 px-4 sm:px-6 py-4">
                {selectedSimulation.takeaways.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Talking Points
                    </h4>
                    <ul className="space-y-2">
                      {selectedSimulation.takeaways.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : selectedSimulation.status === "in_progress" ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-xs">Simulation in progress...</p>
                  </div>
                ) : selectedSimulation.status === "failed" ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-xs">This simulation did not complete.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-xs">No talking points available.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedSimulation.status === "completed" &&
                selectedSimulation.score &&
                selectedSimulation.score >= 70 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-border bg-secondary/30 shrink-0">
                    <div className="space-y-3">
                      {coffeeChatSent && (
                        <div className={`p-3 rounded-lg text-sm ${coffeeChatSent.includes("Failed") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                          {coffeeChatSent}
                        </div>
                      )}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                        onClick={() => handleReachOut(selectedSimulation.id)}
                        disabled={sendingCoffeeChat}
                      >
                        <Mail className="w-4 h-4" />
                        {sendingCoffeeChat ? "Preparing..." : "Reach Out"}
                      </Button>
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>Loading simulation...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
