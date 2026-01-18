"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Sparkles, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Auto-simulation interval in milliseconds (30 seconds)
const AUTO_SIMULATION_INTERVAL = 30000

export function AgentStatus() {
  const [isActive, setIsActive] = useState(true)
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const [lastSimulationTime, setLastSimulationTime] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const isRunningRef = useRef(false)

  const runSimulation = useCallback(async (isAuto: boolean = false) => {
    // Prevent running if already running
    if (isRunningRef.current) {
      console.log("Simulation already running, skipping...")
      return
    }

    isRunningRef.current = true
    setIsRunningSimulation(true)

    if (!isAuto) {
      console.log("Run Simulation button clicked")
    } else {
      console.log("Auto-running simulation...")
    }
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Auth error:", authError)
        if (!isAuto) {
          alert("Authentication error: " + authError.message)
        }
        return
      }
      
      if (!user) {
        console.error("No user found")
        if (!isAuto) {
          alert("You must be logged in")
        }
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
        if (!isAuto) {
          throw new Error(`Server error (${res.status}): Received non-JSON response. This usually means the server encountered an error.`)
        }
        return
      }
      
      const data = await res.json()
      console.log("Auto-connect API response:", data)

      if (res.ok && data.success !== false) {
        const simulationsRun = data.simulationsRun || 0
        const total = data.total || 0
        console.log(`Auto-connect successful: ${simulationsRun} simulations run out of ${total} total`)
        setLastSimulationTime(new Date())
        
        if (simulationsRun > 0) {
          // Only reload page if not auto-running (to avoid disrupting user)
          if (!isAuto) {
            setTimeout(() => window.location.reload(), 1000)
          } else {
            // For auto-simulations, just refresh the data without full page reload
            setTimeout(() => {
              if (isMountedRef.current) {
                window.dispatchEvent(new CustomEvent('simulation-completed'))
              }
            }, 500)
          }
        } else {
          if (!isAuto) {
            alert(data.message || "No new simulations to run. You may have already simulated with all available users.")
          }
        }
      } else {
        const errorMsg = data.error || data.message || `Server error (${res.status})`
        console.error("Auto-connect failed:", errorMsg)
        if (!isAuto) {
          alert(errorMsg)
        }
      }
    } catch (error: any) {
      console.error("Simulation error:", error)
      const errorMessage = error.message || error.toString() || "Failed to run simulations"
      if (!isAuto) {
        alert(errorMessage)
      }
    } finally {
      isRunningRef.current = false
      setIsRunningSimulation(false)
    }
  }, [])

  const handleRunSimulation = useCallback(() => runSimulation(false), [runSimulation])

  // Auto-simulation effect
  useEffect(() => {
    isMountedRef.current = true

    if (isActive) {
      // Set up interval for auto-simulation
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current && isActive && !isRunningRef.current) {
          runSimulation(true).catch(console.error)
        }
      }, AUTO_SIMULATION_INTERVAL)

      // Run first simulation after a short delay if none has run yet
      if (!lastSimulationTime) {
        const initialDelay = setTimeout(() => {
          if (isMountedRef.current && isActive && !isRunningRef.current) {
            runSimulation(true).catch(console.error)
          }
        }, 5000) // Wait 5 seconds before first auto-simulation

        return () => {
          clearTimeout(initialDelay)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }
    } else {
      // Clear interval if paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, lastSimulationTime, runSimulation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
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
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20" : ""}
                >
                  {isActive ? "Active" : "Paused"}
                </Badge>
                {isActive && isRunningSimulation && (
                  <Badge className="bg-blue-500/10 text-blue-500 text-xs animate-pulse">
                    Running...
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `Running simulations automatically${lastSimulationTime ? ` • Last: ${getTimeSinceLastSimulation()}` : ''}`
                  : "Agent is paused. Resume to continue networking."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRunSimulation()
              }}
              disabled={isRunningSimulation}
              size="sm"
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground border-0 shadow-sm"
              type="button"
            >
              {isRunningSimulation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Simulations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run All Simulations
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 sm:flex-none gap-2 bg-secondary/50 hover:bg-secondary border-border/50 text-foreground hover:text-foreground`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
