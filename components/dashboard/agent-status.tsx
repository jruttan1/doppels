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
        return
      }
      
      if (!user) {
        console.error("No user found")
        alert("You must be logged in")
        return
      }

      console.log("Calling simulation API for user:", user.id)
      const res = await fetch('/api/simulation/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      console.log("Simulation API response status:", res.status)
      const data = await res.json()
      console.log("Simulation API response:", data)

      if (data.success) {
        console.log("Simulation successful, reloading page...")
        // Refresh the page to show new simulation
        setTimeout(() => window.location.reload(), 500)
      } else {
        console.error("Simulation failed:", data.error)
        alert(data.error || "Failed to run simulation")
      }
    } catch (error: any) {
      console.error("Simulation error:", error)
      alert(error.message || "Failed to run simulation")
    } finally {
      setIsRunningSimulation(false)
    }
  }

  return (
    <Card className="bg-card border-border overflow-hidden shadow-md">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <CardContent className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Zap className="w-6 h-6 text-teal-500 dark:text-teal-400" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Your Doppel</h3>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
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
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              type="button"
            >
              {isRunningSimulation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Simulation
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none gap-2 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant={isActive ? "outline" : "default"}
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 sm:flex-none gap-2 ${isActive ? "bg-transparent" : "bg-primary text-primary-foreground"}`}
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
