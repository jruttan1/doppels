"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function AgentStatus() {
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const [lastSimulationTime, setLastSimulationTime] = useState<Date | null>(null)
  const isMountedRef = useRef(true)
  const isRunningRef = useRef(false)

  const runSimulation = useCallback(async () => {
    // Prevent running if already running
    if (isRunningRef.current) {
      console.log("Simulation already running, skipping...")
      return
    }

    isRunningRef.current = true
    setIsRunningSimulation(true)
    console.log("Run Simulation button clicked")

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        alert("Authentication error: " + authError.message)
        return
      }

      if (!user) {
        console.error("No user found")
        alert("You must be logged in")
        return
      }

      console.log("Calling auto-connect API for user:", user.id)

      // Call auto-connect to run simulations with all users
      const res = await fetch('/api/simulation/auto-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      console.log("Auto-connect API response status:", res.status)

      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error("Non-JSON response received:", text.substring(0, 200))
        throw new Error(`Server error (${res.status}): Received non-JSON response.`)
      }

      const data = await res.json()
      console.log("Auto-connect API response:", data)

      if (res.ok && data.success !== false) {
        setLastSimulationTime(new Date())

        if (data.simulationId) {
          // Simulation started - reload to show it
          setTimeout(() => window.location.reload(), 1000)
        } else if (data.done) {
          alert(data.message || "No new simulations to run. You may have already simulated with all available users.")
        }
      } else {
        const errorMsg = data.error || data.message || `Server error (${res.status})`
        console.error("Auto-connect failed:", errorMsg)
        alert(errorMsg)
      }
    } catch (error: any) {
      console.error("Simulation error:", error)
      alert(error.message || "Failed to run simulation")
    } finally {
      isRunningRef.current = false
      setIsRunningSimulation(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Format time since last simulation
  const getTimeSinceLastSimulation = () => {
    if (!lastSimulationTime) return null
    const seconds = Math.floor((Date.now() - lastSimulationTime.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  return (
    <Card className="bg-card border-border overflow-hidden shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Your Doppel</h3>
                {isRunningSimulation && (
                  <Badge className="bg-blue-500/10 text-blue-500 text-xs animate-pulse">
                    Running...
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRunningSimulation
                  ? "Starting a new conversation..."
                  : lastSimulationTime
                    ? `Last simulation: ${getTimeSinceLastSimulation()}`
                    : "Ready to network"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={runSimulation}
              disabled={isRunningSimulation}
              className="gap-2 bg-secondary/50 hover:bg-secondary border-border/50 text-foreground hover:text-foreground"
            >
              <Play className="w-4 h-4" />
              {isRunningSimulation ? "Starting..." : "Start Simulation"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
