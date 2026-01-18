"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RefreshCw, Zap, Sparkles, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function AgentStatus() {
  const [isActive, setIsActive] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const handleRunSimulation = async () => {
    console.log("Run Simulation button clicked")
    setIsRunningSimulation(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Auth error:", authError)
        alert("Authentication error: " + authError.message)
        setIsRunningSimulation(false)
        return
      }
      
      if (!user) {
        console.error("No user found")
        alert("You must be logged in")
        setIsRunningSimulation(false)
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
      const data = await res.json()
      console.log("Auto-connect API response:", data)

      if (res.ok && data.success !== false) {
        const simulationsRun = data.simulationsRun || 0
        const total = data.total || 0
        console.log(`Auto-connect successful: ${simulationsRun} simulations run out of ${total} total`)
        
        if (simulationsRun > 0) {
          // Refresh the page to show new simulations
          setTimeout(() => window.location.reload(), 1000)
        } else {
          alert(data.message || "No new simulations to run. You may have already simulated with all available users.")
          setIsRunningSimulation(false)
        }
      } else {
        console.error("Auto-connect failed:", data.error || data.message)
        alert(data.error || data.message || "Failed to run simulations")
        setIsRunningSimulation(false)
      }
    } catch (error: any) {
      console.error("Simulation error:", error)
      alert(error.message || "Failed to run simulations")
      setIsRunningSimulation(false)
    }
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
              </div>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "Running simulations and finding matches..."
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none gap-2 bg-secondary/50 hover:bg-secondary border-border/50 text-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
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
