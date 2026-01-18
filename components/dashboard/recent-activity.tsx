"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2, XCircle, MessageSquare, UserPlus, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ActivityItem {
  id: string
  type: "simulation_complete" | "match_found" | "connection_made" | "simulation_failed" | "agent_update"
  title: string
  description: string
  time: string
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "match_found":
      return <Zap className="w-4 h-4 text-green-500" />
    case "simulation_complete":
      return <MessageSquare className="w-4 h-4 text-primary" />
    case "connection_made":
      return <UserPlus className="w-4 h-4 text-purple-500" />
    case "simulation_failed":
      return <XCircle className="w-4 h-4 text-muted-foreground" />
    case "agent_update":
      return <CheckCircle2 className="w-4 h-4 text-yellow-500" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

const getActivityBadge = (type: ActivityItem["type"]) => {
  switch (type) {
    case "match_found":
      return <Badge className="bg-green-500/10 text-green-500 text-xs">Match</Badge>
    case "simulation_complete":
      return <Badge className="bg-primary/10 text-primary text-xs">Simulation</Badge>
    case "connection_made":
      return <Badge className="bg-purple-500/10 text-purple-500 text-xs">Connected</Badge>
    case "simulation_failed":
      return (
        <Badge variant="secondary" className="text-xs">
          Filtered
        </Badge>
      )
    case "agent_update":
      return <Badge className="bg-yellow-500/10 text-yellow-500 text-xs">Update</Badge>
    default:
      return null
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch recent simulations
        const { data: simulations, error } = await supabase
          .from('simulations')
          .select('id, participant2, score, created_at')
          .eq('participant1', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error || !simulations) {
          console.error("Error fetching activity:", error)
          return
        }

        if (simulations.length === 0) {
          setActivities([])
          return
        }

        // Fetch user names
        const userIds = simulations.map(s => s.participant2)
        const { data: users } = await supabase
          .from('users')
          .select('id, name, tagline, persona')
          .in('id', userIds)

        const userMap = new Map(users?.map(u => [u.id, u]) || [])

        // Map simulations to activity items
        const activityItems: ActivityItem[] = simulations.map((sim) => {
          const user = userMap.get(sim.participant2)
          const persona = user?.persona as any
          const identity = persona?.identity || {}
          const tagline = user?.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          const roleText = company ? `${role} @ ${company}` : role

          const createdAt = new Date(sim.created_at)
          const now = new Date()
          const diffMs = now.getTime() - createdAt.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          let time = "Just now"
          if (diffDays > 0) {
            time = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
          } else if (diffHours > 0) {
            time = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
          } else {
            const diffMins = Math.floor(diffMs / (1000 * 60))
            if (diffMins > 0) {
              time = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
            }
          }

          if (sim.score && sim.score >= 70) {
            return {
              id: sim.id,
              type: "match_found",
              title: "New High Match",
              description: `${sim.score}% compatibility with ${user?.name || "Unknown"} (${roleText})`,
              time,
            }
          } else if (sim.score !== null && sim.score !== undefined) {
            return {
              id: sim.id,
              type: "simulation_failed",
              title: "Low Compatibility",
              description: `${sim.score}% match with ${user?.name || "Unknown"} - filtered out`,
              time,
            }
          } else {
            return {
              id: sim.id,
              type: "simulation_complete",
              title: "Simulation Complete",
              description: `Conversation with ${user?.name || "Unknown"} finished`,
              time,
            }
          }
        })

        setActivities(activityItems)
      } catch (error) {
        console.error("Error in fetchActivity:", error)
      }
    }

    fetchActivity()
  }, [supabase])

  return (
    <Card className="glass border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No recent activity</p>
          ) : (
            activities.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {getActivityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {getActivityBadge(item.type)}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{item.time}</p>
              </div>
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
