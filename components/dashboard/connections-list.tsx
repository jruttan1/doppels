"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Sparkles } from "lucide-react"
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
}

export function ConnectionsList() {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionPreview | null>(null)
  const [connections, setConnections] = useState<ConnectionPreview[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch simulations with score >= 70 (matches)
        const { data: simulations, error } = await supabase
          .from('simulations')
          .select(`
            participant2,
            score,
            created_at,
            transcript
          `)
          .eq('participant1', user.id)
          .gte('score', 70)
          .order('created_at', { ascending: false })

        if (error) {
          console.error("Error fetching connections:", error)
          return
        }

        if (!simulations || simulations.length === 0) {
          setConnections([])
          return
        }

        // Fetch user details for matched users
        const userIds = simulations.map(s => s.participant2)
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, tagline, persona')
          .in('id', userIds)

        if (usersError || !users) {
          console.error("Error fetching user details:", usersError)
          return
        }

        // Map to ConnectionPreview
        const connectionsList: ConnectionPreview[] = simulations.map((sim) => {
          const user = users.find(u => u.id === sim.participant2)
          const persona = user?.persona as any
          const identity = persona?.identity || {}
          const tagline = user?.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          const roleText = company ? `${role} @ ${company}` : role

          // Generate icebreaker from transcript or default
          const transcript = sim.transcript as any[]
          let icebreaker = "High compatibility match"
          if (transcript && Array.isArray(transcript) && transcript.length > 0) {
            const firstMsg = transcript[0]?.text || transcript[0]?.content || ""
            icebreaker = firstMsg.substring(0, 100) + (firstMsg.length > 100 ? "..." : "")
          }

          // Format time
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

        setConnections(connectionsList)
      } catch (error) {
        console.error("Error in fetchConnections:", error)
      }
    }

    fetchConnections()
  }, [supabase])

  const matchedConnections = connections.filter((c) => c.status === "matched")
  const connectedConnections = connections.filter((c) => c.status === "connected")

  return (
    <>
      <Card className="bg-card border-border h-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Connections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="matches" className="w-full">
            <div className="px-6">
              <TabsList className="w-full bg-secondary/50">
                <TabsTrigger value="matches" className="flex-1">
                  Matches ({matchedConnections.length})
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex-1">
                  Connected ({connectedConnections.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="matches" className="mt-0">
              <div className="divide-y divide-border">
                {matchedConnections.map((connection) => (
                  <button
                    key={connection.id}
                    className="w-full p-4 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {connection.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-card flex items-center justify-center">
                          <Sparkles className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{connection.name}</p>
                          <Badge variant="outline" className="shrink-0 text-teal-500 border-teal-500/30 text-xs">
                            {connection.compatibility}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{connection.role}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{connection.icebreaker}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="connected" className="mt-0">
              <div className="divide-y divide-border">
                {connectedConnections.map((connection) => (
                  <button
                    key={connection.id}
                    className="w-full p-4 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {connection.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{connection.name}</p>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Connected
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{connection.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">{connection.matchedAt}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConnectionDetailModal connection={selectedConnection} onClose={() => setSelectedConnection(null)} />
    </>
  )
}
