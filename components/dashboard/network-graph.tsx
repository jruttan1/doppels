"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ZoomIn, ZoomOut, Search, Sparkles, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

interface NetworkNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  status: "unexplored" | "simulated" | "matched" | "connected"
  name: string
  role: string
  company: string
  compatibility?: number
  avatar?: string
  skills: string[]
  simulationId?: string
}

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<(() => void) | null>(null)
  const zoomRef = useRef(1)
  const filterRef = useRef<"all" | "matched" | "simulated" | "unexplored">("all")
  const filteredNodesRef = useRef<NetworkNode[]>([])
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<"all" | "matched" | "simulated" | "unexplored">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [sendingCoffeeChat, setSendingCoffeeChat] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState<string | null>(null)
  const supabase = createClient()

  const handleReachOut = async (simulationId: string) => {
    setSendingCoffeeChat(true)
    setCoffeeChatSent(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/send-coffee-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId, senderId: user.id })
      })

      const result = await response.json()

      if (!response.ok) {
        setCoffeeChatSent(result.error || "Failed to get contact info")
        return
      }

      const subject = encodeURIComponent(
        `Intro via Doppel: ${result.senderName} <> ${result.receiverName}`
      )
      const body = encodeURIComponent(
        `Hey ${result.receiverFirstName},\n\n` +
        `My AI agent just ran a simulation with yours on Doppel.\n` +
        `It flagged our conversation as a ${result.score}% match` +
        ` (specifically regarding ${result.topTakeaway}).\n\n` +
        `The transcript looked interesting, so I wanted to reach out directly.\n\n` +
        `Best,\n${result.senderName}\n(Sent via Doppel)`
      )

      window.location.href = `mailto:${result.receiverEmail}?subject=${subject}&body=${body}`
    } catch (error) {
      setCoffeeChatSent("Failed to prepare email")
    } finally {
      setSendingCoffeeChat(false)
    }
  }

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [supabase])
  
  // Update refs when state changes and trigger redraw
  useEffect(() => {
    zoomRef.current = zoom
    if (drawRef.current) {
      requestAnimationFrame(() => {
        if (drawRef.current) drawRef.current()
      })
    }
  }, [zoom])
  
  useEffect(() => {
    filterRef.current = filter
    if (drawRef.current) {
      requestAnimationFrame(() => {
        if (drawRef.current) drawRef.current()
      })
    }
  }, [filter])

  // Fetch users and their simulation statuses
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch all users with personas (excluding current user)
        const { data: allUsers, error: usersError } = await supabase
          .from('users')
          .select('id, name, tagline, persona, skills')
          .neq('id', user.id)
          .not('persona', 'is', null)
          .not('persona', 'eq', '{}')

        if (usersError || !allUsers) {
          console.error("Error fetching users:", usersError)
          return
        }

        // Fetch simulations for current user to determine status
        const { data: simulations, error: simError } = await supabase
          .from('simulations')
          .select('id, participant2, score')
          .eq('participant1', user.id)

        if (simError) {
          console.error("Error fetching simulations:", simError)
        }

        // Create maps of user_id -> best score and simulation id
        const userScores = new Map<string, number>()
        const userSimulationIds = new Map<string, string>()
        simulations?.forEach((sim) => {
          const existing = userScores.get(sim.participant2)
          if (!existing || (sim.score && sim.score > existing)) {
            userScores.set(sim.participant2, sim.score || 0)
            userSimulationIds.set(sim.participant2, sim.id)
          }
        })

        // Map users to network nodes
        const userNodes: Omit<NetworkNode, "x" | "y" | "vx" | "vy">[] = allUsers.map((u) => {
          const score = userScores.get(u.id)
          let status: "unexplored" | "simulated" | "matched" | "connected" = "unexplored"
          
          if (score !== undefined) {
            if (score >= 70) {
              status = "matched"
            } else {
              status = "simulated"
            }
          }

          // Extract role and company from tagline or persona
          const tagline = u.tagline || ""
          const persona = u.persona as any
          const identity = persona?.identity || {}
          const role = identity?.role || tagline.split("@")[0]?.trim() || "Professional"
          const company = identity?.company || tagline.split("@")[1]?.split("|")[0]?.trim() || "Unknown"
          const skills = u.skills || persona?.skills_possessed || []

          return {
            id: u.id,
            status,
            name: u.name || "Unknown",
            role,
            company,
            compatibility: score,
            avatar: undefined,
            skills: Array.isArray(skills) ? skills : [],
            simulationId: userSimulationIds.get(u.id),
          }
        })

        // Initialize layout
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Helper function to get node size for collision detection
        const getNodeSize = (status: NetworkNode["status"]) => {
          switch (status) {
            case "connected": return 16
            case "matched": return 14
            case "simulated": return 10
            default: return 8
          }
        }

        // Get minimum required distance between two nodes
        const getMinDistance = (node1: NetworkNode, node2: NetworkNode) => {
          const size1 = getNodeSize(node1.status)
          const size2 = getNodeSize(node2.status)
          return size1 + size2 + 50
        }

        // Collision detection function
        const hasCollision = (x: number, y: number, existingNodes: NetworkNode[], currentNode: NetworkNode) => {
          return existingNodes.some((existing) => {
            const dist = Math.hypot(x - existing.x, y - existing.y)
            const minDist = getMinDistance(currentNode, existing)
            return dist < minDist
          })
        }

        const padding = 60
        const maxCanvasRadius = Math.min(rect.width, rect.height) / 2 - padding
        
        // Group nodes by status for circular arrangement
        const nodesByStatus = {
          connected: userNodes.filter(n => n.status === "connected"),
          matched: userNodes.filter(n => n.status === "matched"),
          simulated: userNodes.filter(n => n.status === "simulated"),
          unexplored: userNodes.filter(n => n.status === "unexplored"),
        }
        
        // Define radius ranges for each status (closer to center = higher priority)
        const getRadiusForStatus = (status: NetworkNode["status"], index: number, total: number) => {
          const baseRadius = {
            connected: 100,
            matched: 150,
            simulated: 220,
            unexplored: 280,
          }[status]
          
          // Add some variation to prevent perfect circles
          const variation = 30
          return baseRadius + (Math.random() - 0.5) * variation
        }
        
        // Initialize nodes in circular arrangements by status
        const initialNodes: NetworkNode[] = []
        
        Object.entries(nodesByStatus).forEach(([status, nodes]) => {
          nodes.forEach((node, index) => {
            const radius = getRadiusForStatus(node.status as NetworkNode["status"], index, nodes.length)
            // Distribute nodes evenly around the circle for this status
            const angle = (index / nodes.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
            const x = centerX + Math.cos(angle) * radius
            const y = centerY + Math.sin(angle) * radius
            
            initialNodes.push({
              ...node,
              x,
              y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
            })
          })
        })

        // Build connection graph: create connections between nodes
        const connections: Array<[number, number, number]> = [] // [i, j, strength]
        
        initialNodes.forEach((node, i) => {
          initialNodes.forEach((other, j) => {
            if (i >= j) return
            
            let strength = 0
            
            // Strong connections: same status (connected/matched)
            if (
              (node.status === "connected" && other.status === "connected") ||
              (node.status === "matched" && other.status === "matched")
            ) {
              strength = 1.0
            }
            // Medium connections: connected/matched cross-connections
            else if (
              (node.status === "connected" && other.status === "matched") ||
              (node.status === "matched" && other.status === "connected")
            ) {
              strength = 0.8
            }
            // Weak connections: connect to simulated nodes
            else if (
              (node.status === "connected" || node.status === "matched") &&
              (other.status === "simulated")
            ) {
              strength = 0.3
            }
            // Very weak connections: connect simulated to simulated
            else if (
              node.status === "simulated" && other.status === "simulated"
            ) {
              strength = 0.2
            }
            
            if (strength > 0) {
              connections.push([i, j, strength])
            }
          })
        })

        // Force-directed layout simulation (no circular constraints)
        const iterations = 250
        const k = Math.sqrt((rect.width * rect.height) / initialNodes.length) * 1.3 // Optimal distance between nodes
        const temperature = Math.max(rect.width, rect.height) / 8 // Higher temperature for more movement
        let currentTemp = temperature
        
        for (let iter = 0; iter < iterations; iter++) {
          initialNodes.forEach((node, i) => {
            let fx = 0
            let fy = 0
            
            // Repulsion from other nodes (spreads them out)
            initialNodes.forEach((other, j) => {
              if (i === j) return
              
              const dx = node.x - other.x
              const dy = node.y - other.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
              
              // Repulsion for all nodes, stronger when close
              if (dist < k * 2.5) {
                const repulsion = (k * k) / (dist * dist)
                fx += (dx / dist) * repulsion * 0.6
                fy += (dy / dist) * repulsion * 0.6
              }
            })
            
            // Attraction forces from connections (creates natural clustering)
            connections.forEach(([a, b, strength]) => {
              if (a === i || b === i) {
                const other = initialNodes[a === i ? b : a]
                const dx = node.x - other.x
                const dy = node.y - other.y
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
                
                // Spring force: attract connected nodes to optimal distance
                const idealDist = k * (0.7 + (1 - strength) * 0.6) // Stronger connections = closer
                const force = (dist - idealDist) / k
                fx -= (dx / dist) * force * strength * 0.7
                fy -= (dy / dist) * force * strength * 0.7
              }
            })
            
            // Circular constraint: keep nodes in their circular arrangement
            const targetRadius = {
              connected: 100,
              matched: 150,
              simulated: 220,
              unexplored: 280,
            }[node.status]
            
            const dxToCenter = node.x - centerX
            const dyToCenter = node.y - centerY
            const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter) || 0.1
            
            // Calculate the ideal position on the circle
            const idealX = centerX + (dxToCenter / distToCenter) * targetRadius
            const idealY = centerY + (dyToCenter / distToCenter) * targetRadius
            
            // Apply force to maintain circular position (stronger for important nodes)
            const circularForce = node.status === "connected" || node.status === "matched" ? 0.15 : 0.1
            fx -= (node.x - idealX) * circularForce
            fy -= (node.y - idealY) * circularForce
            
            // Update velocity with damping
            node.vx = (node.vx + fx) * 0.9
            node.vy = (node.vy + fy) * 0.9
            
            // Limit velocity by temperature
            const v = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
            if (v > currentTemp) {
              node.vx = (node.vx / v) * currentTemp
              node.vy = (node.vy / v) * currentTemp
            }
            
            // Update position
            node.x += node.vx
            node.y += node.vy
            
            // Keep within bounds (soft boundary)
            const margin = padding * 0.2
            if (node.x < margin) {
              node.x = margin
              node.vx *= -0.3
            } else if (node.x > rect.width - margin) {
              node.x = rect.width - margin
              node.vx *= -0.3
            }
            if (node.y < margin) {
              node.y = margin
              node.vy *= -0.3
            } else if (node.y > rect.height - margin) {
              node.y = rect.height - margin
              node.vy *= -0.3
            }
          })
          
          // Cool down temperature
          currentTemp = temperature * (1 - iter / iterations) * 0.5
        }

        setNodes(initialNodes)
      } catch (error) {
        console.error("Error fetching network data:", error)
      }
    }

    fetchUsers()
  }, [supabase])

  const filteredNodes = useMemo(() => {
    const result = nodes.filter((node) => {
      if (filter !== "all" && node.status !== filter) return false
      if (
        searchQuery &&
        !node.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !node.role.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !node.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false
      return true
    })
    filteredNodesRef.current = result
    return result
  }, [nodes, filter, searchQuery])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || nodes.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const getNodeColor = (status: NetworkNode["status"]) => {
      switch (status) {
        case "connected":
          return { fill: "rgba(168, 85, 247, 0.9)", glow: "rgba(168, 85, 247, 0.5)", size: 16 }
        case "matched":
          return { fill: "rgba(20, 184, 166, 0.9)", glow: "rgba(20, 184, 166, 0.5)", size: 14 }
        case "simulated":
          return { fill: "rgba(45, 212, 191, 0.7)", glow: "rgba(45, 212, 191, 0.3)", size: 10 }
        default:
          return { fill: "rgba(100, 116, 139, 0.4)", glow: "rgba(100, 116, 139, 0.1)", size: 8 }
      }
    }

    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }

    const draw = () => {
      if (!ctx || !canvas) return
      
      // Get current values from refs (always latest)
      const currentZoom = zoomRef.current
      const currentFilteredNodes = filteredNodesRef.current
      
      ctx.clearRect(0, 0, rect.width, rect.height)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(currentZoom, currentZoom)
      ctx.translate(-centerX, -centerY)

      // Draw grid
      ctx.strokeStyle = "rgba(100, 116, 139, 0.05)"
      ctx.lineWidth = 1
      for (let i = 0; i < rect.width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, rect.height)
        ctx.stroke()
      }
      for (let i = 0; i < rect.height; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(rect.width, i)
        ctx.stroke()
      }

      // Draw connections
      nodes.forEach((node) => {
        const isFiltered = currentFilteredNodes.some((n) => n.id === node.id)
        const colors = getNodeColor(node.status)
        const opacity = isFiltered ? 1 : 0.15
        const glowMatch = colors.glow.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (glowMatch) {
          const [, r, g, b] = glowMatch
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
        } else {
          ctx.strokeStyle = colors.glow
        }
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(node.x, node.y)
        ctx.lineWidth = node.status === "matched" || node.status === "connected" ? 2 : 0.5
        ctx.stroke()
      })

      // Draw inter-node connections based on connection graph
      // Recreate connection logic (same as layout)
      nodes.forEach((node, i) => {
        const isNodeFiltered = currentFilteredNodes.some((n) => n.id === node.id)
        if (!isNodeFiltered) return
        
        nodes.slice(i + 1).forEach((other, j) => {
          const isOtherFiltered = currentFilteredNodes.some((n) => n.id === other.id)
          if (!isOtherFiltered) return
          
          let strength = 0
          let connectionColor = "rgba(100, 116, 139, 0.1)"
          
          // Strong connections: same status (connected/matched)
          if (
            (node.status === "connected" && other.status === "connected") ||
            (node.status === "matched" && other.status === "matched")
          ) {
            strength = 1.0
            if (node.status === "connected") {
              connectionColor = "rgba(168, 85, 247, 0.4)"
            } else {
              connectionColor = "rgba(20, 184, 166, 0.4)"
            }
          }
          // Medium connections: connected/matched cross-connections
          else if (
            (node.status === "connected" && other.status === "matched") ||
            (node.status === "matched" && other.status === "connected")
          ) {
            strength = 0.8
            connectionColor = "rgba(168, 85, 247, 0.3)"
          }
          // Weak connections: connect to simulated nodes
          else if (
            (node.status === "connected" || node.status === "matched") &&
            (other.status === "simulated")
          ) {
            strength = 0.3
            connectionColor = "rgba(45, 212, 191, 0.2)"
          }
          // Very weak connections: connect simulated to simulated
          else if (
            node.status === "simulated" && other.status === "simulated"
          ) {
            strength = 0.2
            connectionColor = "rgba(45, 212, 191, 0.15)"
          }
          
          if (strength > 0) {
            const dist = Math.hypot(node.x - other.x, node.y - other.y)
            const maxDist = 400 // Maximum distance to draw connection
            if (dist < maxDist) {
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(other.x, other.y)
              const opacity = strength * (1 - dist / maxDist) * 0.6
              ctx.strokeStyle = connectionColor.replace(/[\d\.]+\)$/, `${opacity})`)
              ctx.lineWidth = strength * 1.5
              ctx.stroke()
            }
          }
        })
      })

      // Draw center node
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40)
      gradient.addColorStop(0, "rgba(45, 212, 191, 0.4)")
      gradient.addColorStop(1, "rgba(45, 212, 191, 0)")
      ctx.beginPath()
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(centerX, centerY, 22, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(45, 212, 191, 0.9)"
      ctx.fill()

      ctx.fillStyle = "#0d1117"
      ctx.font = "bold 11px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("YOU", centerX, centerY)

      // Draw outer nodes (NO NAMES - only initials)
      nodes.forEach((node) => {
        const isFiltered = currentFilteredNodes.some((n) => n.id === node.id)
        const colors = getNodeColor(node.status)
        const opacity = isFiltered ? 1 : 0.15

        if ((node.status === "matched" || node.status === "connected") && isFiltered) {
          const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, colors.size + 12)
          glowGradient.addColorStop(0, colors.glow)
          glowGradient.addColorStop(1, "transparent")
          ctx.beginPath()
          ctx.arc(node.x, node.y, colors.size + 12, 0, Math.PI * 2)
          ctx.fillStyle = glowGradient
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, colors.size, 0, Math.PI * 2)
        const fillMatch = colors.fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (fillMatch) {
          const [, r, g, b] = fillMatch
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
        } else {
          ctx.fillStyle = colors.fill
        }
        ctx.fill()

        // Draw initials inside the node (NO NAME BELOW)
        const textOpacity = isFiltered ? 0.95 : 0.4
        ctx.fillStyle = `rgba(0, 0, 0, ${textOpacity})`
        ctx.font = `bold ${Math.max(8, colors.size * 0.5)}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const initials = getInitials(node.name)
        ctx.fillText(initials, node.x, node.y)
      })

      ctx.restore()
    }

    // Store draw function in ref for external calls
    drawRef.current = draw

    // Force initial draw
    draw()

    const handleResize = () => {
      const newRect = container.getBoundingClientRect()
      canvas.width = newRect.width * window.devicePixelRatio
      canvas.height = newRect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      draw()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [nodes, filteredNodes, zoom, filter, searchQuery])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePos({ x: e.clientX, y: e.clientY })

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const adjustedX = (x - centerX) / zoom + centerX
      const adjustedY = (y - centerY) / zoom + centerY

      // Check if hovering over center "YOU" node (don't allow hover/click on it)
      const distToCenter = Math.hypot(adjustedX - centerX, adjustedY - centerY)
      if (distToCenter < 30) {
        setHoveredNode(null)
        return
      }

      const hovered = filteredNodes.find((node) => {
        // Also exclude current user's node from hover
        if (node.id === currentUserId) return false
        const dist = Math.hypot(node.x - adjustedX, node.y - adjustedY)
        return dist < 25
      })
      setHoveredNode(hovered || null)
    },
    [filteredNodes, zoom, currentUserId],
  )


  // Mouse wheel zoom disabled
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      // Zoom on scroll disabled - allow normal page scrolling
    },
    [],
  )

  const handleMouseEnter = useCallback(() => {
    // Don't prevent page scrolling anymore
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null)
  }, [])

  // Hit-test for node at client coords (used for touch tap-to-select when hover isn't available)
  const getNodeAtPoint = useCallback(
    (clientX: number, clientY: number): NetworkNode | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const zoomVal = zoomRef.current
      const adjustedX = (x - centerX) / zoomVal + centerX
      const adjustedY = (y - centerY) / zoomVal + centerY
      if (Math.hypot(adjustedX - centerX, adjustedY - centerY) < 30) return null
      const node = filteredNodesRef.current.find((n) => {
        if (n.id === currentUserId) return false
        return Math.hypot(n.x - adjustedX, n.y - adjustedY) < 25
      })
      return node ?? null
    },
    [currentUserId],
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const node = hoveredNode ?? getNodeAtPoint(e.clientX, e.clientY)
      if (!node || node.id === currentUserId) return
      if (node.status === "matched" || node.status === "connected") {
        setSelectedNode(node)
      }
    },
    [hoveredNode, currentUserId, getNodeAtPoint],
  )

  return (
    <>
      <Card className="bg-card border-border shadow-md h-full flex flex-col overflow-hidden relative">
        <CardHeader className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 pb-1.5 pt-3 px-4 flex-shrink-0 h-auto">
          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
            <div className="relative min-w-0 flex-1 sm:flex-initial" style={{ minWidth: 80 }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full min-w-0 sm:w-40 md:w-48 h-9 sm:h-8 bg-secondary/50 text-xs"
              />
            </div>
            <div className="relative z-10 pointer-events-auto">
              <Tabs value={filter} onValueChange={(v) => {
                const newFilter = v as typeof filter
                if (v === "all" || v === "matched" || v === "simulated" || v === "unexplored") {
                  setFilter(newFilter)
                }
              }}>
                <TabsList className="bg-secondary/50 pointer-events-auto h-9 sm:h-8 min-h-[44px] sm:min-h-0">
                  <TabsTrigger value="all" className="text-[10px] sm:text-[10px] px-3 sm:px-2 h-9 sm:h-7 min-h-[44px] sm:min-h-0 pointer-events-auto">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="matched" className="text-[10px] sm:text-[10px] px-3 sm:px-2 h-9 sm:h-7 min-h-[44px] sm:min-h-0 pointer-events-auto">
                    Matches
                  </TabsTrigger>
                  <TabsTrigger value="simulated" className="text-[10px] sm:text-[10px] px-3 sm:px-2 h-9 sm:h-7 min-h-[44px] sm:min-h-0 pointer-events-auto">
                    Simulated
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-1 sm:ml-2 relative z-10 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 cursor-pointer pointer-events-auto touch-manipulation"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newZoom = Math.min(zoom + 0.2, 2)
                  setZoom(newZoom)
                }}
                type="button"
                disabled={false}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 cursor-pointer pointer-events-auto touch-manipulation"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newZoom = Math.max(zoom - 0.2, 0.5)
                  setZoom(newZoom)
                }}
                type="button"
                disabled={false}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          </div>
          {/* Stats in header */}
          <div className="glass px-2.5 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-muted-foreground text-[10px] leading-tight">Total Nodes</p>
                <p className="font-bold text-sm leading-tight">{nodes.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] leading-tight">High Matches</p>
                  <p className="font-bold text-sm text-teal-500 leading-tight">
                  {nodes.filter((n) => n.status === "matched").length}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <div ref={containerRef} className="relative h-full w-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-manipulation"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              onClick={handleCanvasClick}
            />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 glass px-4 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-muted-foreground">Match</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                <span className="text-muted-foreground">Simulated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-500/40" />
                <span className="text-muted-foreground">Unexplored</span>
              </div>
            </div>


            {/* Hover tooltip */}
            {hoveredNode && (
              <div
                className="fixed z-50 glass px-4 py-3 rounded-lg pointer-events-none transform -translate-x-1/2 -translate-y-full min-w-[200px]"
                style={{ left: mousePos.x, top: mousePos.y - 10 }}
              >
                <p className="font-medium text-sm">{hoveredNode.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hoveredNode.role} @ {hoveredNode.company}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hoveredNode.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {hoveredNode.compatibility && (
                  <Badge className="mt-2 bg-teal-500/10 text-teal-500 border-teal-500/30">
                    {hoveredNode.compatibility}% match
                  </Badge>
                )}
                {(hoveredNode.status === "matched" || hoveredNode.status === "connected") && (
                  <p className="text-xs text-primary mt-2">Click to view details</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Node detail dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => { setSelectedNode(null); setCoffeeChatSent(null); }}>
        <DialogContent className="max-w-lg bg-card border-border shadow-lg rounded-[4px] h-[calc(100vh-3.5rem)] w-full max-h-[calc(100vh-3.5rem)] mt-14 sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-lg sm:mt-0 flex flex-col p-0 sm:p-6 !fixed !top-14 !left-0 !right-0 !bottom-0 sm:!inset-auto sm:!top-[50%] sm:!left-[50%] !translate-x-0 !translate-y-0 sm:!translate-x-[-50%] sm:!translate-y-[-50%] rounded-none sm:rounded-[4px] overflow-hidden !z-[60]">
          {selectedNode && (
            <>
              <div className="flex-1 overflow-y-auto px-4 sm:px-0 pb-4 sm:pb-0 min-w-0">
                <DialogHeader className="pt-6 sm:pt-0">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={selectedNode.avatar || "/placeholder.svg?height=64&width=64&query=professional headshot"}
                        />
                        <AvatarFallback className="text-lg">
                          {selectedNode.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {selectedNode.status === "matched" && selectedNode.id !== currentUserId && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-card flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl">{selectedNode.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.role} @ {selectedNode.company}
                      </p>
                      {selectedNode.id !== currentUserId && (
                        <div className="flex items-center gap-2 mt-2">
                          {selectedNode.compatibility && (
                            <Badge className="bg-teal-500/10 text-teal-500">{selectedNode.compatibility}% Match</Badge>
                          )}
                          <Badge variant="secondary" className="capitalize">
                            {selectedNode.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedNode.compatibility && selectedNode.id !== currentUserId && (
                    <div className="space-y-4 min-w-0">
                      <h4 className="text-sm font-medium">Compatibility Breakdown</h4>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 min-w-0">
                        <div className="space-y-1 min-w-0">
                          <div className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground shrink-0">Relevance</span>
                            <span className="shrink-0">{Math.round(selectedNode.compatibility * 0.98)}%</span>
                          </div>
                          <Progress value={selectedNode.compatibility * 0.98} className="h-2 w-full" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground shrink-0">Reciprocity</span>
                            <span className="shrink-0">{Math.round(selectedNode.compatibility * 0.92)}%</span>
                          </div>
                          <Progress value={selectedNode.compatibility * 0.92} className="h-2 w-full" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground shrink-0">Tone Match</span>
                            <span className="shrink-0">{Math.round(selectedNode.compatibility * 1.02)}%</span>
                          </div>
                          <Progress value={Math.min(selectedNode.compatibility * 1.02, 100)} className="h-2 w-full" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNode.id !== currentUserId && (
                    <div className="space-y-3 pt-2 pb-4 sm:pb-0 min-w-0">
                      {coffeeChatSent && (
                        <div className={`p-3 rounded-lg text-sm ${coffeeChatSent.includes("Failed") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                          {coffeeChatSent}
                        </div>
                      )}
                      <Button
                        className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => selectedNode.simulationId && handleReachOut(selectedNode.simulationId)}
                        disabled={sendingCoffeeChat || !selectedNode.simulationId}
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sendingCoffeeChat ? "Preparing..." : "Reach Out"}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
