"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"
import { ConnectionDetailModal } from "./connection-detail-modal"
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
}

export function ConnectionsSimulationsSidebar() {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionPreview | null>(null)
  const [activeTab, setActiveTab] = useState<"connections" | "simulations">("connections")
  const [connections, setConnections] = useState<ConnectionPreview[]>([])
  const [simulationsLoaded, setSimulationsLoaded] = useState(false)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

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
            const partnerUser = userMap.get(sim.partnerId)
            const persona = partnerUser?.persona as any
            const identity = persona?.identity || {}
            const tagline = partnerUser?.tagline || ""
            const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
            const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
            const roleText = company ? `${role} @ ${company}` : role

            const takeaways = (sim.takeaways as string[] | null) || []
            const icebreaker = takeaways.length > 0
              ? takeaways[0].substring(0, 120) + (takeaways[0].length > 120 ? "..." : "")
              : `${sim.score}% compatibility match`

            const matchedAt = "Just now"

            return {
              id: partnerUser?.id || sim.partnerId,
              name: partnerUser?.name || "Unknown",
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
          const partnerUser = userMap.get(sim.partnerId)
          const persona = partnerUser?.persona as any
          const identity = persona?.identity || {}
          const tagline = partnerUser?.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          const roleText = company ? `${role} @ ${company}` : role

          const startedAt = "Just now"

          return {
            id: sim.id,
            targetName: partnerUser?.name || "Unknown",
            targetRole: roleText,
            targetAvatar: undefined,
            status: (sim as any).status === 'completed' ? "completed"
              : (sim as any).status === 'failed' ? "failed"
              : (sim as any).status === 'running' ? "in_progress"
              : sim.score !== null && sim.score !== undefined ? "completed"
              : "in_progress",
            score: sim.score ?? undefined,
            startedAt,
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
                Simulations ({simulations.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="connections" className="flex-1 mt-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full min-h-0">
              <div className="divide-y divide-border pb-4">
                {matchedConnections.length === 0 && connectedConnections.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <p className="text-xs">No matches yet. Check back after simulations complete.</p>
                  </div>
                )}
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
                {simulations.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <p className="text-xs">No simulations yet.</p>
                  </div>
                )}
                {simulations.map((simulation) => (
                  <div
                    key={simulation.id}
                    className="w-full p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={simulation.targetAvatar || "/placeholder.svg"}
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
                      </div>
                    </div>
                  </div>
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
    </>
  )
}
