"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Sparkles, MessageSquare, CheckCircle2, XCircle, Clock, Bot, ArrowRight } from "lucide-react"
import { ConnectionDetailModal } from "./connection-detail-modal"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
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
}

interface Simulation {
  id: string
  targetName: string
  targetRole: string
  targetAvatar?: string
  status: "completed" | "in_progress" | "failed"
  score?: number
  turns: number
  startedAt: string
  completedAt?: string
  messages: { agent: "A" | "B"; message: string }[]
  summary?: string
}

export function ConnectionsSimulationsSidebar() {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionPreview | null>(null)
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)
  const [activeTab, setActiveTab] = useState<"connections" | "simulations">("connections")
  const [connections, setConnections] = useState<ConnectionPreview[]>([])
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch all simulations
        const { data: simsData, error: simError } = await supabase
          .from('simulations')
          .select('id, participant2, score, transcript, created_at')
          .eq('participant1', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (simError) {
          // Error fetching simulations - silently fail
          return
        }

        if (!simsData || simsData.length === 0) {
          setConnections([])
          setSimulations([])
          return
        }

        // Fetch user details
        const userIds = [...new Set(simsData.map(s => s.participant2))]
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, tagline, persona')
          .in('id', userIds)

        if (usersError || !users) {
          // Error fetching user details - silently fail
          return
        }

        const userMap = new Map(users.map(u => [u.id, u]))

        // Build connections (score >= 70)
        const connectionsList: ConnectionPreview[] = simsData
          .filter(s => s.score && s.score >= 70)
          .map((sim) => {
            const user = userMap.get(sim.participant2)
            const persona = user?.persona as any
            const identity = persona?.identity || {}
            const tagline = user?.tagline || ""
            const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
            const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
            const roleText = company ? `${role} @ ${company}` : role

            const transcript = sim.transcript as any[]
            let icebreaker = "High compatibility match"
            if (transcript && Array.isArray(transcript) && transcript.length > 0) {
              const firstMsg = transcript[0]?.text || transcript[0]?.content || ""
              icebreaker = firstMsg.substring(0, 100) + (firstMsg.length > 100 ? "..." : "")
            }

            const createdAt = new Date(sim.created_at)
            const now = new Date()
            const diffMs = now.getTime() - createdAt.getTime()
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffHours / 24)
            let matchedAt = "Just now"
            if (diffDays > 0) {
              matchedAt = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
            } else if (diffHours > 0) {
              matchedAt = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
            } else {
              const diffMins = Math.floor(diffMs / (1000 * 60))
              if (diffMins > 0) {
                matchedAt = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
              }
            }

            return {
              id: user?.id || sim.participant2,
              name: user?.name || "Unknown",
              role: roleText,
              avatar: "",
              compatibility: sim.score || 0,
              icebreaker,
              status: "matched" as const,
              matchedAt,
            }
          })

        // Build simulations list
        const simulationsList: Simulation[] = simsData.map((sim) => {
          const user = userMap.get(sim.participant2)
          const persona = user?.persona as any
          const identity = persona?.identity || {}
          const tagline = user?.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          const roleText = company ? `${role} @ ${company}` : role

          const transcript = sim.transcript as any[]
          const messages = (transcript || []).map((msg: any, idx: number) => ({
            agent: (idx % 2 === 0 ? "A" : "B") as "A" | "B",
            message: msg.text || msg.content || "",
          }))

          const createdAt = new Date(sim.created_at)
          const now = new Date()
          const diffMs = now.getTime() - createdAt.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          let startedAt = "Just now"
          if (diffDays > 0) {
            startedAt = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
          } else if (diffHours > 0) {
            startedAt = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
          } else {
            const diffMins = Math.floor(diffMs / (1000 * 60))
            if (diffMins > 0) {
              startedAt = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
            }
          }

          return {
            id: sim.id,
            targetName: user?.name || "Unknown",
            targetRole: roleText,
            targetAvatar: undefined,
            status: sim.score !== null && sim.score !== undefined ? "completed" : "in_progress",
            score: sim.score || undefined,
            turns: messages.length,
            startedAt,
            completedAt: sim.score !== null ? startedAt : undefined,
            messages,
            summary: sim.score && sim.score >= 70 ? "High compatibility match" : undefined,
          }
        })

        setConnections(connectionsList)
        setSimulations(simulationsList)
      } catch (error) {
        // Error in fetchData - silently fail
      }
    }

    fetchData()
  }, [supabase])

  const matchedConnections = connections.filter((c) => c.status === "matched")
  const connectedConnections = connections.filter((c) => c.status === "connected")

  // Function definitions continue below

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
        return (
          <Badge className={score && score >= 70 ? "bg-teal-500/10 text-teal-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
            {score}%
          </Badge>
        )
      case "in_progress":
        return <Badge className="bg-yellow-500/10 text-yellow-500 text-xs animate-pulse">...</Badge>
      case "failed":
        return <Badge variant="secondary" className="text-xs">No</Badge>
    }
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

          <TabsContent value="connections" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {matchedConnections.map((connection) => (
                  <button
                    key={connection.id}
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setSelectedConnection(connection)}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-xs truncate">{connection.name}</p>
                          <Badge variant="outline" className="shrink-0 text-teal-500 border-teal-500/30 text-[10px] px-1">
                            {connection.compatibility}%
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{connection.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{connection.icebreaker}</p>
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-xs truncate">{connection.name}</p>
                          <Badge variant="secondary" className="shrink-0 text-[10px] px-1">
                            Connected
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{connection.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{connection.matchedAt}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="simulations" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {simulations.map((simulation) => (
                  <button
                    key={simulation.id}
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setSelectedSimulation(simulation)}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-xs truncate">{simulation.targetName}</p>
                          {getStatusBadge(simulation.status, simulation.score)}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{simulation.targetRole}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {simulation.turns}
                          </span>
                          <span>{simulation.startedAt}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <ConnectionDetailModal connection={selectedConnection} onClose={() => setSelectedConnection(null)} />

      {/* Simulation detail dialog */}
      <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-lg rounded-[4px] h-full w-full max-h-full sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-2xl flex flex-col p-0 sm:p-6 fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-[4px]">
          {selectedSimulation && (
            <>
              <div className="flex-1 overflow-y-auto px-4 pr-12 sm:pr-4 sm:px-0 pb-4 sm:pb-0">
                <DialogHeader className="pt-6 sm:pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Your Agent</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={
                            selectedSimulation.targetAvatar ||
                            "/placeholder.svg?height=40&width=40&query=professional headshot"
                          }
                        />
                        <AvatarFallback>
                          {selectedSimulation.targetName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{selectedSimulation.targetName}</p>
                        <p className="text-xs text-muted-foreground">{selectedSimulation.targetRole}</p>
                      </div>
                    </div>
                    <div className="ml-auto">{getStatusBadge(selectedSimulation.status, selectedSimulation.score)}</div>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4 mt-4">
                  <div className="space-y-4">
                    {selectedSimulation.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.agent === "A" ? "" : "flex-row-reverse"}`}>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.agent === "A" ? "bg-primary/20" : "bg-secondary"
                          }`}
                        >
                          {msg.agent === "A" ? (
                            <Bot className="w-4 h-4 text-primary" />
                          ) : (
                            <span className="text-xs font-medium">
                              {selectedSimulation.targetName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.agent === "A"
                              ? "bg-primary/10 border border-primary/20 rounded-tl-none"
                              : "bg-secondary rounded-tr-none"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    {selectedSimulation.status === "in_progress" && (
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium">
                            {selectedSimulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="bg-secondary p-4 rounded-2xl rounded-tr-none">
                          <div className="flex gap-1">
                            <span
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {selectedSimulation.summary && (
                  <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-medium">AI Summary</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedSimulation.summary}</p>
                  </div>
                )}

                {selectedSimulation.status === "completed" &&
                  selectedSimulation.score &&
                  selectedSimulation.score >= 70 && (
                    <div className="flex gap-3 mt-4 pb-4 sm:pb-0">
                      <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                        Book Coffee Chat
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Save for Later
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
