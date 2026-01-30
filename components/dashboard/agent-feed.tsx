"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface TranscriptMessage {
  speaker: string
  id: string
  text: string
  timestamp: string
}

interface AgentFeedProps {
  simulationId: string
  partnerName: string
  currentUserName: string
  onComplete: (score: number) => void
}

const STALL_TIMEOUT = 180_000 // 3 minutes

export function AgentFeed({ simulationId, partnerName, currentUserName, onComplete }: AgentFeedProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [status, setStatus] = useState<"running" | "completed" | "failed">("running")
  const [score, setScore] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const supabase = createClient()

  const handleComplete = useCallback((s: number) => {
    if (completedRef.current) return
    completedRef.current = true
    setScore(s)
    setStatus("completed")
    onComplete(s)
  }, [onComplete])

  useEffect(() => {
    completedRef.current = false

    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("simulations")
        .select("transcript, score, status")
        .eq("id", simulationId)
        .single()

      if (data) {
        setMessages(data.transcript || [])
        if (data.status === "completed" && data.score !== null && data.score !== undefined) {
          handleComplete(data.score)
        } else if (data.status === "failed") {
          handleComplete(0)
        }
      }
    }
    fetchInitial()

    // Realtime subscription
    const channel = supabase
      .channel(`simulation-${simulationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "simulations",
          filter: `id=eq.${simulationId}`,
        },
        (payload) => {
          const row = payload.new as any
          if (row.transcript) {
            setMessages(row.transcript)
          }
          if (row.status === "completed" && row.score !== null && row.score !== undefined) {
            handleComplete(row.score)
          } else if (row.status === "failed") {
            handleComplete(0)
          }
        }
      )
      .subscribe()

    // Stall timeout
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        handleComplete(0)
      }
    }, STALL_TIMEOUT)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timeout)
    }
  }, [simulationId, supabase, handleComplete])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="rounded-lg border border-border bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{currentUserName}</span>
          <span>&harr;</span>
          <span className="font-medium text-foreground">{partnerName}</span>
        </div>
        {status === "running" ? (
          <Badge className="bg-blue-500/10 text-blue-500 text-[10px] animate-pulse">Live</Badge>
        ) : score !== null ? (
          <Badge className={score >= 70 ? "bg-teal-500/10 text-teal-500 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
            {score}%
          </Badge>
        ) : null}
      </div>

      {/* Messages */}
      <ScrollArea className="h-72">
        <div className="p-3 space-y-3">
          {messages.map((msg, i) => {
            const isMe = i % 2 === 0 // agent A = current user
            const speakerName = isMe ? currentUserName : partnerName
            return (
              <div key={i} className={`flex gap-2 ${isMe ? "" : "flex-row-reverse"}`}>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className={`text-[10px] ${isMe ? "bg-primary/20 text-primary" : "bg-secondary"}`}>
                    {getInitials(speakerName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`min-w-0 ${isMe ? "" : "flex flex-col items-end"}`}>
                  <div
                    className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-primary/10 border border-primary/20 rounded-tl-none"
                        : "bg-secondary rounded-tr-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {status === "running" && (
            <div className="flex gap-2 flex-row-reverse">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="text-[10px] bg-secondary">
                  {getInitials(partnerName)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary px-3 py-2 rounded-2xl rounded-tr-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
