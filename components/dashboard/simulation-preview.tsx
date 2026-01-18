"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ArrowRight, Sparkles, Bot } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SimulationMessage {
  agent: "A" | "B"
  message: string
}

export function SimulationPreview() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<SimulationMessage[]>([])
  const [targetName, setTargetName] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchLatestSimulation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch the most recent simulation
        const { data: simulation, error } = await supabase
          .from('simulations')
          .select('participant2, transcript, score')
          .eq('participant1', user.id)
          .not('transcript', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error || !simulation) {
          return
        }

        // Fetch target user details
        const { data: targetUser } = await supabase
          .from('users')
          .select('name, tagline, persona')
          .eq('id', simulation.participant2)
          .single()

        if (targetUser) {
          const persona = targetUser.persona as any
          const identity = persona?.identity || {}
          const tagline = targetUser.tagline || ""
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || ""
          setTargetRole(company ? `${role} @ ${company}` : role)
          setTargetName(targetUser.name || "Unknown")
        }

        // Convert transcript to messages
        const transcript = simulation.transcript as any[]
        if (transcript && Array.isArray(transcript)) {
          const simMessages: SimulationMessage[] = transcript.map((msg: any, idx: number) => ({
            agent: (idx % 2 === 0 ? "A" : "B") as "A" | "B",
            message: msg.text || msg.content || "",
          }))
          setMessages(simMessages)
        }
      } catch (error) {
        console.error("Error fetching simulation:", error)
      }
    }

    fetchLatestSimulation()
  }, [supabase])

  useEffect(() => {
    if (messages.length > 0 && currentIndex < messages.length - 1) {
      const timer = setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
          setIsTyping(false)
        }, 1500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, messages.length])

  return (
    <Card className="glass border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Live Simulation
          </CardTitle>
          <Badge className="bg-green-500/10 text-green-500 animate-pulse">In Progress</Badge>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">Your Agent</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/woman-tech-executive.jpg" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{targetName || "Unknown"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-[250px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No simulation data available</p>
          ) : (
            messages.slice(0, currentIndex + 1).map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.agent === "A" ? "" : "justify-end"}`}>
              <div
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  msg.agent === "A" ? "bg-primary/10 border border-primary/20" : "bg-secondary"
                }`}
              >
                <p className="text-muted-foreground leading-relaxed">{msg.message}</p>
              </div>
            </div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-2 justify-end">
              <div className="bg-secondary p-3 rounded-xl">
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
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Compatibility looking strong</span>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              View Full
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
