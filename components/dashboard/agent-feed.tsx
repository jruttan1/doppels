"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { SimulationOrb, type SimulationPhase } from "./simulation-orb"

interface TranscriptMessage {
  speaker: string
  id: string
  text: string
  timestamp: string
}

interface ThoughtEntry {
  text: string
  turnNumber: number
  timestamp: string
}

interface AgentFeedProps {
  simulationId: string
  partnerName: string
  currentUserName: string
  onComplete: (score: number) => void
}

const STALL_TIMEOUT = 180_000 // 3 minutes
const THOUGHT_DISPLAY_MS = 6000

export function AgentFeed({
  simulationId,
  partnerName,
  currentUserName,
  onComplete,
}: AgentFeedProps) {
  const [messageCount, setMessageCount] = useState(0)
  const [status, setStatus] = useState<"running" | "completed" | "failed">("running")
  const [score, setScore] = useState<number | null>(null)
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>([])
  const [visibleThought, setVisibleThought] = useState<ThoughtEntry | null>(null)
  const [thoughtFading, setThoughtFading] = useState(false)
  const completedRef = useRef(false)
  const supabase = createClient()

  const handleComplete = useCallback(
    (s: number) => {
      if (completedRef.current) return
      completedRef.current = true
      setScore(s)
      setStatus("completed")
      onComplete(s)
    },
    [onComplete]
  )

  // Realtime subscription
  useEffect(() => {
    completedRef.current = false

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("simulations")
        .select("transcript, score, status, thoughts")
        .eq("id", simulationId)
        .single()

      if (data) {
        setMessageCount((data.transcript as TranscriptMessage[] | null)?.length || 0)
        setThoughts((data.thoughts as ThoughtEntry[] | null) || [])
        if (data.status === "completed" && data.score !== null && data.score !== undefined) {
          handleComplete(data.score)
        } else if (data.status === "failed") {
          handleComplete(0)
        }
      }
    }
    fetchInitial()

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
            setMessageCount((row.transcript as TranscriptMessage[]).length)
          }
          if (row.thoughts) {
            setThoughts(row.thoughts as ThoughtEntry[])
          }
          if (row.status === "completed" && row.score !== null && row.score !== undefined) {
            handleComplete(row.score)
          } else if (row.status === "failed") {
            handleComplete(0)
          }
        }
      )
      .subscribe()

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

  // Show new thoughts with fade-in/fade-out
  useEffect(() => {
    if (thoughts.length === 0) return
    const latest = thoughts[thoughts.length - 1]

    // Don't re-show the same thought
    if (visibleThought?.timestamp === latest.timestamp) return

    setThoughtFading(false)
    setVisibleThought(latest)

    const fadeTimer = setTimeout(() => setThoughtFading(true), THOUGHT_DISPLAY_MS - 500)
    const hideTimer = setTimeout(() => {
      setVisibleThought(null)
      setThoughtFading(false)
    }, THOUGHT_DISPLAY_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [thoughts.length])

  // Derive phase
  const phase: SimulationPhase =
    status === "completed" && score !== null
      ? "done"
      : status === "completed"
        ? "analyzing"
        : messageCount === 0
          ? "connecting"
          : "chatting"

  // Status text
  const statusText =
    phase === "connecting"
      ? `reaching out to ${partnerName}...`
      : phase === "chatting" && messageCount < 5
        ? "your agent is chatting..."
        : phase === "chatting"
          ? "deep in conversation..."
          : phase === "analyzing"
            ? "analyzing compatibility..."
            : score !== null && score >= 70
              ? `${score}% — match found`
              : score !== null
                ? `${score}%`
                : ""

  return (
    <div className="h-full flex flex-col rounded-lg border border-border bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-black shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{currentUserName}</span>
          <span className="opacity-40">&rarr;</span>
          <span className="font-medium text-foreground">{partnerName}</span>
        </div>
        {phase !== "done" ? (
          <Badge className="bg-blue-500/10 text-teal-500 text-[10px] animate-pulse border-0">
            Live
          </Badge>
        ) : score !== null ? (
          <Badge
            className={
              score >= 70
                ? "bg-teal-500/10 text-teal-500 text-[10px] border-0"
                : "bg-muted text-muted-foreground text-[10px] border-0"
            }
          >
            {score}%
          </Badge>
        ) : null}
      </div>

      {/* Orb + Thoughts */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative bg-black">
        <SimulationOrb phase={phase} />

        {/* Status text */}
        <p className="text-[11px] text-muted-foreground/60 mt-4 tracking-wide lowercase">
          {statusText}
        </p>

        {/* Thought bubble */}
        {visibleThought && (
          <div
            className={`mt-5 max-w-[85%] text-center transition-opacity duration-500 ${
              thoughtFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
              &ldquo;{visibleThought.text}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
