"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Sparkles, MessageSquare, CheckCircle2, XCircle, Clock, ArrowRight, Calendar } from "lucide-react"
import { ConnectionDetailModal } from "./connection-detail-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  const [currentUserName, setCurrentUserName] = useState<string>("You")
  const [sendingCoffeeChat, setSendingCoffeeChat] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState<string | null>(null)
  const supabase = createClient()

  const handleBookCoffeeChat = async (simulationId: string) => {
    setSendingCoffeeChat(true)
    setCoffeeChatSent(null)
    
    // Show toast after 1.5 seconds
    setTimeout(() => {
      toast.success("Email sent!", {
        description: "Coffee chat invitation has been sent.",
        duration: 3000,
      })
    }, 1500)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("No user found")
        return
      }

      const response = await fetch('/api/send-coffee-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          senderId: user.id
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setCoffeeChatSent(result.message || "Invitation sent!")
      } else {
        console.error("Failed to send:", result.error)
        setCoffeeChatSent("Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending coffee chat:", error)
      setCoffeeChatSent("Failed to send invitation")
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

        // Fetch all simulations
        const { data: simsData, error: simError } = await supabase
          .from('simulations')
          .select('id, participant2, score, transcript')
          .eq('participant1', user.id)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(50)

        if (simError) {
          console.error("Error fetching simulations:", simError)
          console.error("Error details:", JSON.stringify(simError, null, 2))
          // Silently fail - user might not have any simulations yet
          setConnections([])
          setSimulations([])
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

            // No created_at column, so just show "Just now"
            const matchedAt = "Just now"

            return {
              id: user?.id || sim.participant2,
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

          // No created_at column, so just show "Just now"
          const startedAt = "Just now"

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
    
    // Poll for new simulations every 10 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 10000)
    
    return () => clearInterval(interval)
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
                    type="button"
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log("Connection clicked:", connection.id, connection.name)
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
                    type="button"
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log("Simulation clicked:", simulation.id, simulation.targetName)
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

      <ConnectionDetailModal 
        connection={selectedConnection} 
        onClose={() => {
          setSelectedConnection(null)
          // Don't clear selectedSimulation here - we might be switching to view a simulation
        }}
        onViewSimulation={async (simId) => {
          // Clear any existing simulation first
          setSelectedSimulation(null)
          console.log("onViewSimulation called with:", simId)
          console.log("Available simulations:", simulations.map(s => s.id))
          
          // First try to find in existing simulations array
          let sim = simulations.find(s => s.id === simId)
          console.log("Found simulation in array:", !!sim)
          
          // If not found, fetch it directly from the database
          if (!sim && selectedConnection) {
            console.log("Fetching simulation from database...")
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return

              const { data: simData } = await supabase
                .from('simulations')
                .select('id, participant2, score, transcript')
                .eq('id', simId)
                .eq('participant1', user.id)
                .single()

              if (simData) {
                // Fetch user details for the simulation
                const { data: targetUser } = await supabase
                  .from('users')
                  .select('id, name, tagline, persona')
                  .eq('id', simData.participant2)
                  .single()

                if (targetUser) {
                  const persona = targetUser.persona as any
                  const identity = persona?.identity || {}
                  const tagline = targetUser.tagline || ""
                  const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
                  const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
                  const roleText = company ? `${role} @ ${company}` : role

                  const transcript = simData.transcript as any[]
                  const messages = (transcript || []).map((msg: any, idx: number) => ({
                    agent: (idx % 2 === 0 ? "A" : "B") as "A" | "B",
                    message: msg.text || msg.content || "",
                  }))

                  sim = {
                    id: simData.id,
                    targetName: targetUser.name || "Unknown",
                    targetRole: roleText,
                    targetAvatar: undefined,
                    status: simData.score !== null && simData.score !== undefined ? "completed" : "in_progress",
                    score: simData.score || undefined,
                    turns: messages.length,
                    startedAt: "Just now",
                    completedAt: simData.score !== null ? "Just now" : undefined,
                    messages,
                    summary: simData.score && simData.score >= 70 ? "High compatibility match" : undefined,
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching simulation:", error)
            }
          }

          if (sim) {
            console.log("Setting selected simulation:", sim.id)
            setSelectedSimulation(sim)
            setSelectedConnection(null)
          } else {
            console.error("Simulation not found:", simId)
            console.error("Available simulations:", simulations.map(s => ({ id: s.id, name: s.targetName })))
          }
        }}
      />

      {/* Simulation detail dialog - Improved Chat UI */}
      <Dialog 
        open={!!selectedSimulation} 
        onOpenChange={(open) => {
          console.log("Simulation dialog onOpenChange:", open, selectedSimulation?.id)
          if (!open) {
            setSelectedSimulation(null)
          }
        }}
        key={selectedSimulation?.id} // Force re-render when simulation changes
      >
        <DialogContent className="max-w-3xl bg-card border-border shadow-lg h-[95vh] w-[95vw] max-h-[95vh] sm:h-[85vh] sm:max-h-[85vh] sm:w-auto sm:max-w-3xl flex flex-col p-0 rounded-lg z-[100]">
          {selectedSimulation ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <DialogHeader>
                  <DialogTitle className="sr-only">Simulation Chat: {selectedSimulation.targetName}</DialogTitle>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                            {currentUserName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">Your Agent</p>
                          <p className="text-xs text-muted-foreground">{currentUserName}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={
                              selectedSimulation.targetAvatar ||
                              "/placeholder.svg?height=48&width=48&query=professional headshot"
                            }
                          />
                          <AvatarFallback className="text-sm">
                            {selectedSimulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{selectedSimulation.targetName}</p>
                          <p className="text-xs text-muted-foreground">{selectedSimulation.targetRole}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedSimulation.status, selectedSimulation.score)}
                      <div className="text-xs text-muted-foreground">
                        {selectedSimulation.turns} messages
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full w-full px-6 py-4">
                  <div className="space-y-6">
                  {selectedSimulation.messages.map((msg, i) => {
                    const isMyAgent = msg.agent === "A"
                    return (
                      <div key={i} className={`flex gap-4 ${isMyAgent ? "" : "flex-row-reverse"}`}>
                        <div className="shrink-0">
                          {isMyAgent ? (
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                                {currentUserName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="w-10 h-10">
                              <AvatarImage
                                src={
                                  selectedSimulation.targetAvatar ||
                                  "/placeholder.svg?height=40&width=40&query=professional headshot"
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {selectedSimulation.targetName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className={`flex-1 min-w-0 ${isMyAgent ? "" : "flex flex-col items-end"}`}>
                          <div
                            className={`inline-block max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl ${
                              isMyAgent
                                ? "bg-primary/10 border border-primary/20 rounded-tl-none"
                                : "bg-secondary rounded-tr-none"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          </div>
                          {i === selectedSimulation.messages.length - 1 && (
                            <p className="text-[10px] text-muted-foreground mt-1 px-1">
                              {selectedSimulation.startedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {selectedSimulation.status === "in_progress" && (
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-xs">
                            {selectedSimulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="bg-secondary p-4 rounded-2xl rounded-tr-none">
                        <div className="flex gap-1.5">
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
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-secondary/30">
                {selectedSimulation.summary && (
                  <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-xs font-medium">AI Summary</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedSimulation.summary}</p>
                  </div>
                )}

                {selectedSimulation.status === "completed" &&
                  selectedSimulation.score &&
                  selectedSimulation.score >= 70 && (
                    <div className="space-y-3">
                      {coffeeChatSent && (
                        <div className={`p-3 rounded-lg text-sm ${coffeeChatSent.includes("Failed") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                          {coffeeChatSent}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => handleBookCoffeeChat(selectedSimulation.id)}
                          disabled={sendingCoffeeChat || coffeeChatSent?.includes("sent")}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          {sendingCoffeeChat ? "Sending..." : coffeeChatSent?.includes("sent") ? "Invitation Sent!" : "Book Coffee Chat"}
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent">
                          Save for Later
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
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
