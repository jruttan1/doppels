"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  status: "unexplored" | "simulated" | "matched"
  name: string
  role: string
  compatibility?: number
}

const DEMO_NODES: Omit<Node, "x" | "y" | "vx" | "vy">[] = [
  { id: "1", status: "matched", name: "Sarah Chen", role: "CTO @ Fintech", compatibility: 94 },
  { id: "2", status: "matched", name: "Marcus Reed", role: "Eng Lead @ Series B", compatibility: 87 },
  { id: "3", status: "simulated", name: "Julia Park", role: "PM @ AI Startup" },
  { id: "4", status: "simulated", name: "David Kim", role: "Founder @ B2B SaaS" },
  { id: "5", status: "unexplored", name: "Alex Morgan", role: "VP Eng @ Growth" },
  { id: "6", status: "unexplored", name: "Rachel Liu", role: "Staff Eng @ FAANG" },
  { id: "7", status: "matched", name: "Chris Patel", role: "Angel Investor", compatibility: 91 },
  { id: "8", status: "simulated", name: "Emma Wilson", role: "Design Lead" },
  { id: "9", status: "unexplored", name: "James Taylor", role: "Backend Eng" },
  { id: "10", status: "simulated", name: "Sophia Adams", role: "Head of Growth" },
]

export function NetworkDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Initialize nodes in a circle around center
    const initialNodes: Node[] = DEMO_NODES.map((node, i) => {
      const angle = (i / DEMO_NODES.length) * Math.PI * 2
      const radius = 120 + Math.random() * 80
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }
    })
    setNodes(initialNodes)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    let animationId: number

    const getNodeColor = (status: Node["status"]) => {
      switch (status) {
        case "matched":
          return { fill: "rgba(34, 197, 94, 0.9)", glow: "rgba(34, 197, 94, 0.6)" }
        case "simulated":
          return { fill: "rgba(45, 212, 191, 0.6)", glow: "rgba(45, 212, 191, 0.3)" }
        default:
          return { fill: "rgba(100, 116, 139, 0.4)", glow: "rgba(100, 116, 139, 0.1)" }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Simple physics
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges with padding
        const padding = 60
        if (node.x < padding || node.x > rect.width - padding) node.vx *= -1
        if (node.y < padding || node.y > rect.height - padding) node.vy *= -1

        // Gentle attraction to center
        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * 0.0001
        node.vy += dy * 0.0001

        // Damping
        node.vx *= 0.99
        node.vy *= 0.99

        // Draw connections to center
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(node.x, node.y)
        const colors = getNodeColor(node.status)
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = node.status === "matched" ? 2 : 1
        ctx.stroke()

        // Draw connections between nearby matched nodes
        if (node.status === "matched") {
          nodes.slice(i + 1).forEach((other) => {
            if (other.status === "matched") {
              const dist = Math.hypot(node.x - other.x, node.y - other.y)
              if (dist < 200) {
                ctx.beginPath()
                ctx.moveTo(node.x, node.y)
                ctx.lineTo(other.x, other.y)
                ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 * (1 - dist / 200)})`
                ctx.lineWidth = 1
                ctx.stroke()
              }
            }
          })
        }
      })

      // Draw center node (You)
      ctx.beginPath()
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(45, 212, 191, 0.2)"
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(45, 212, 191, 0.9)"
      ctx.fill()

      // Draw outer nodes
      nodes.forEach((node) => {
        const colors = getNodeColor(node.status)
        const size = node.status === "matched" ? 12 : 8

        // Glow effect for matched
        if (node.status === "matched") {
          ctx.beginPath()
          ctx.arc(node.x, node.y, size + 8, 0, Math.PI * 2)
          ctx.fillStyle = colors.glow
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fillStyle = colors.fill
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [nodes])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMousePos({ x: e.clientX, y: e.clientY })

    const hovered = nodes.find((node) => {
      const dist = Math.hypot(node.x - x, node.y - y)
      return dist < 20
    })
    setHoveredNode(hovered || null)
  }

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Live Network Preview
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Watch Your Network Grow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your Doppel explores the network 24/7. Green nodes are high-compatibility matches ready for you.
          </p>
        </div>

        <div className="relative aspect-square max-w-2xl mx-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-2xl glass cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
          />

          {/* Center label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-center pointer-events-none">
            <span className="text-sm font-medium text-primary">You</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 glass px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-muted-foreground">High Match</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="text-muted-foreground">Simulated</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-slate-500/40" />
              <span className="text-muted-foreground">Unexplored</span>
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredNode && (
            <div
              className="fixed z-50 glass px-4 py-3 rounded-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{ left: mousePos.x, top: mousePos.y - 10 }}
            >
              <p className="font-medium text-sm">{hoveredNode.name}</p>
              <p className="text-xs text-muted-foreground">{hoveredNode.role}</p>
              {hoveredNode.compatibility && (
                <p className="text-xs text-teal-400 mt-1">{hoveredNode.compatibility}% compatibility</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
