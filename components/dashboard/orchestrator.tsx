"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Radio, CheckCircle2, Loader2, Zap, Search } from "lucide-react"
import { AgentFeed } from "./agent-feed"
import { createClient } from "@/lib/supabase/client"

type Phase = "idle" | "finding_target" | "watching" | "cooldown" | "done"

const COOLDOWN_DELAY = 3000
const SCAN_DELAY = 2500 // minimum "scanning" duration for UX

export function Orchestrator() {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [currentSimId, setCurrentSimId] = useState<string | null>(null)
  const [currentPartnerName, setCurrentPartnerName] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState("You")
  const [completedCount, setCompletedCount] = useState(0)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const isMountedRef = useRef(true)
  const isActiveRef = useRef(isActive)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Keep ref in sync
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  // Fetch current user name once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) setCurrentUserName(data.name)
        })
    })
  }, [])

  const findAndStart = useCallback(async () => {
    if (!isMountedRef.current || !isActiveRef.current) return

    setPhase("finding_target")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [data] = await Promise.all([
        fetch("/api/simulation/auto-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        }).then((r) => r.json()),
        new Promise((resolve) => setTimeout(resolve, SCAN_DELAY)),
      ])

      if (!isMountedRef.current || !isActiveRef.current) return

      if (data.done) {
        setPhase("done")
        return
      }

      if (data.error) {
        setTimeout(() => {
          if (isMountedRef.current && isActiveRef.current) {
            findAndStart()
          }
        }, 5000)
        return
      }

      if (data.simulationId) {
        setCurrentSimId(data.simulationId)
        setCurrentPartnerName(data.partnerName || "Unknown")
        setPhase("watching")
      }
    } catch (err) {
      console.error("Orchestrator: findAndStart failed", err)
      setTimeout(() => {
        if (isMountedRef.current && isActiveRef.current) {
          findAndStart()
        }
      }, 5000)
    }
  }, [])

  const handleSimulationComplete = useCallback((score: number) => {
    setLastScore(score)
    setCompletedCount((prev) => prev + 1)
    setPhase("cooldown")

    window.dispatchEvent(new CustomEvent("simulation-completed"))

    cooldownTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return
      setCurrentSimId(null)
      setCurrentPartnerName(null)
      if (isActiveRef.current) {
        findAndStart()
      } else {
        setPhase("idle")
      }
    }, COOLDOWN_DELAY)
  }, [findAndStart])

  // Start loop when toggled on
  useEffect(() => {
    if (isActive && phase === "idle") {
      const delay = setTimeout(() => findAndStart(), 1000)
      return () => clearTimeout(delay)
    }
  }, [isActive, phase, findAndStart])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false)
    } else {
      setIsActive(true)
      setPhase("idle")
    }
  }

  const phaseLabel = () => {
    switch (phase) {
      case "finding_target":
        return "Scanning network for next connection..."
      case "watching":
        return `Agent is talking with ${currentPartnerName}`
      case "cooldown":
        return lastScore !== null
          ? `Scored ${lastScore}%${lastScore >= 70 ? " — Match found!" : ""}`
          : "Processing..."
      case "done":
        return "All available connections explored"
      case "idle":
      default:
        return isActive ? "Starting..." : "Ready to connect"
    }
  }

  return (
    <Card className="bg-card border-border overflow-hidden shadow-md h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {phase === "watching" ? (
              <Radio className="w-4 h-4 text-teal-500 animate-pulse shrink-0" />
            ) : phase === "finding_target" ? (
              <Search className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
            ) : phase === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Auto-Connect</h3>
                {isActive && phase !== "done" && (
                  <Badge className="bg-teal-500/10 text-teal-500 text-[10px]">Active</Badge>
                )}
                {completedCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {completedCount} done
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{phaseLabel()}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={phase === "done"}
            className="gap-1.5 shrink-0 bg-secondary/50 hover:bg-secondary border-border/50 text-foreground hover:text-foreground"
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Live feed */}
        {currentSimId && (phase === "watching" || phase === "cooldown") && (
          <div className="flex-1 min-h-0">
            <AgentFeed
              simulationId={currentSimId}
              partnerName={currentPartnerName || "Unknown"}
              currentUserName={currentUserName}
              onComplete={handleSimulationComplete}
            />
          </div>
        )}

        {/* Scanning animation */}
        {phase === "finding_target" && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-xs font-medium">Browsing nodes...</p>
              <p className="text-[10px] mt-0.5 opacity-60">Looking for compatible connections</p>
            </div>
          </div>
        )}

        {/* Idle state */}
        {phase === "idle" && !isActive && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-muted-foreground">
            <Zap className="w-6 h-6 mb-2 opacity-20" />
            <p className="text-xs">Press Start to begin auto-connecting</p>
          </div>
        )}

        {/* Done state */}
        {phase === "done" && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 mb-2 text-teal-500 opacity-50" />
            <p className="text-xs">All connections explored</p>
            <p className="text-[10px] mt-0.5 opacity-60">{completedCount} simulations completed</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
