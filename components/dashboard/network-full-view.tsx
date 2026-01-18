"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ZoomIn, ZoomOut, Search, Sparkles, Calendar, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
}

const MOCK_NODES: Omit<NetworkNode, "x" | "y" | "vx" | "vy">[] = [
  {
    id: "1",
    status: "matched",
    name: "Sarah Chen",
    role: "CTO",
    company: "Fintech Startup",
    compatibility: 94,
    avatar: "/woman-tech-executive.jpg",
    skills: ["Distributed Systems", "Go", "Kubernetes"],
  },
  {
    id: "2",
    status: "matched",
    name: "Marcus Reed",
    role: "Eng Lead",
    company: "Series B Company",
    compatibility: 87,
    avatar: "/man-engineering-lead.jpg",
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: "3",
    status: "connected",
    name: "Julia Park",
    role: "PM",
    company: "AI Company",
    compatibility: 91,
    avatar: "/woman-product-manager.png",
    skills: ["Product Strategy", "AI/ML", "Growth"],
  },
  {
    id: "4",
    status: "simulated",
    name: "David Kim",
    role: "Founder",
    company: "B2B SaaS",
    skills: ["Sales", "Fundraising", "Strategy"],
  },
  {
    id: "5",
    status: "simulated",
    name: "Alex Morgan",
    role: "VP Engineering",
    company: "Enterprise Co",
    skills: ["Java", "Architecture", "Leadership"],
  },
  {
    id: "6",
    status: "unexplored",
    name: "Rachel Liu",
    role: "Staff Eng",
    company: "FAANG",
    skills: ["ML", "Python", "Infrastructure"],
  },
  {
    id: "7",
    status: "matched",
    name: "Chris Patel",
    role: "Angel Investor",
    company: "Independent",
    compatibility: 89,
    avatar: "/man-investor-professional.jpg",
    skills: ["Investing", "Mentorship", "B2B"],
  },
  {
    id: "8",
    status: "simulated",
    name: "Emma Wilson",
    role: "Design Lead",
    company: "Design Agency",
    skills: ["UX", "Figma", "Design Systems"],
  },
  {
    id: "9",
    status: "unexplored",
    name: "James Taylor",
    role: "Backend Eng",
    company: "Startup",
    skills: ["Rust", "PostgreSQL", "APIs"],
  },
  {
    id: "10",
    status: "simulated",
    name: "Sophia Adams",
    role: "Head of Growth",
    company: "Series A",
    skills: ["Marketing", "Analytics", "SEO"],
  },
  {
    id: "11",
    status: "unexplored",
    name: "Mike Johnson",
    role: "DevOps Lead",
    company: "Tech Corp",
    skills: ["AWS", "Terraform", "CI/CD"],
  },
  {
    id: "12",
    status: "matched",
    name: "Lisa Wang",
    role: "Co-founder",
    company: "Web3 Startup",
    compatibility: 85,
    avatar: "/woman-startup-founder.jpg",
    skills: ["Blockchain", "Solidity", "DeFi"],
  },
  {
    id: "13",
    status: "simulated",
    name: "Tom Brown",
    role: "ML Engineer",
    company: "AI Lab",
    skills: ["PyTorch", "NLP", "Computer Vision"],
  },
  {
    id: "14",
    status: "unexplored",
    name: "Nina Patel",
    role: "Product Designer",
    company: "Agency",
    skills: ["UI Design", "User Research", "Prototyping"],
  },
  {
    id: "15",
    status: "unexplored",
    name: "Ryan Lee",
    role: "Data Scientist",
    company: "Analytics Co",
    skills: ["Python", "SQL", "Statistics"],
  },
  {
    id: "16",
    status: "matched",
    name: "Priya Sharma",
    role: "CRO",
    company: "SaaS Unicorn",
    compatibility: 82,
    skills: ["Revenue Ops", "Enterprise Sales", "GTM"],
  },
  {
    id: "17",
    status: "simulated",
    name: "Kevin O'Brien",
    role: "Architect",
    company: "Consulting",
    skills: ["Cloud", "Microservices", "Security"],
  },
  {
    id: "18",
    status: "unexplored",
    name: "Maya Johnson",
    role: "Engineering Manager",
    company: "Scale-up",
    skills: ["Team Building", "Agile", "Mentorship"],
  },
]

export function NetworkFullView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<"all" | "matched" | "simulated" | "unexplored">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const initialNodes: NetworkNode[] = MOCK_NODES.map((node, i) => {
      const angle = (i / MOCK_NODES.length) * Math.PI * 2 + Math.random() * 0.5
      const radius = 120 + Math.random() * 150
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }
    })
    setNodes(initialNodes)
  }, [])

  const filteredNodes = nodes.filter((node) => {
    if (filter !== "all" && node.status !== filter) return false
    if (
      searchQuery &&
      !node.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !node.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

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

    let animationId: number

    const getNodeColor = (status: NetworkNode["status"], isFiltered: boolean) => {
      const opacity = isFiltered ? 1 : 0.15
      switch (status) {
        case "connected":
          return {
            fill: `rgba(168, 85, 247, ${0.9 * opacity})`,
            glow: `rgba(168, 85, 247, ${0.5 * opacity})`,
            size: 16,
          }
        case "matched":
          return { fill: `rgba(34, 197, 94, ${0.9 * opacity})`, glow: `rgba(34, 197, 94, ${0.5 * opacity})`, size: 14 }
        case "simulated":
          return {
            fill: `rgba(45, 212, 191, ${0.7 * opacity})`,
            glow: `rgba(45, 212, 191, ${0.3 * opacity})`,
            size: 10,
          }
        default:
          return {
            fill: `rgba(100, 116, 139, ${0.4 * opacity})`,
            glow: `rgba(100, 116, 139, ${0.1 * opacity})`,
            size: 8,
          }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(zoom, zoom)
      ctx.translate(-centerX, -centerY)

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        const padding = 80
        if (node.x < padding || node.x > rect.width - padding) node.vx *= -0.8
        if (node.y < padding || node.y > rect.height - padding) node.vy *= -0.8

        node.x = Math.max(padding, Math.min(rect.width - padding, node.x))
        node.y = Math.max(padding, Math.min(rect.height - padding, node.y))

        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * 0.00003
        node.vy += dy * 0.00003

        node.vx *= 0.998
        node.vy *= 0.998
      })

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
        const isFiltered = filteredNodes.some((n) => n.id === node.id)
        const colors = getNodeColor(node.status, isFiltered)
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(node.x, node.y)
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = node.status === "matched" || node.status === "connected" ? 2 : 0.5
        ctx.stroke()
      })

      // Draw inter-node connections
      nodes.forEach((node, i) => {
        if (node.status === "matched" || node.status === "connected") {
          nodes.slice(i + 1).forEach((other) => {
            if (other.status === "matched" || other.status === "connected") {
              const dist = Math.hypot(node.x - other.x, node.y - other.y)
              if (dist < 200) {
                ctx.beginPath()
                ctx.moveTo(node.x, node.y)
                ctx.lineTo(other.x, other.y)
                ctx.strokeStyle = `rgba(34, 197, 94, ${0.15 * (1 - dist / 200)})`
                ctx.lineWidth = 1
                ctx.stroke()
              }
            }
          })
        }
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

      // Draw outer nodes
      nodes.forEach((node) => {
        const isFiltered = filteredNodes.some((n) => n.id === node.id)
        const colors = getNodeColor(node.status, isFiltered)

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
        ctx.fillStyle = colors.fill
        ctx.fill()

        // Draw name for matched/connected
        if ((node.status === "matched" || node.status === "connected") && isFiltered) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.font = "10px sans-serif"
          ctx.fillText(node.name.split(" ")[0], node.x, node.y + colors.size + 12)
        }
      })

      ctx.restore()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [nodes, filteredNodes, zoom])

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

      const hovered = filteredNodes.find((node) => {
        const dist = Math.hypot(node.x - adjustedX, node.y - adjustedY)
        return dist < 25
      })
      setHoveredNode(hovered || null)
    },
    [filteredNodes, zoom],
  )

  const handleClick = useCallback(() => {
    if (hoveredNode && (hoveredNode.status === "matched" || hoveredNode.status === "connected")) {
      setSelectedNode(hoveredNode)
    }
  }, [hoveredNode])

  return (
    <>
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Network Map</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="matched" className="text-xs">
                  Matches
                </TabsTrigger>
                <TabsTrigger value="simulated" className="text-xs">
                  Simulated
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={containerRef} className="relative h-[600px]">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={handleClick}
            />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 glass px-4 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
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

            {/* Stats */}
            <div className="absolute top-4 right-4 glass px-4 py-3 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Nodes</p>
                  <p className="font-bold text-lg">{nodes.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">High Matches</p>
                  <p className="font-bold text-lg text-green-500">
                    {nodes.filter((n) => n.status === "matched").length}
                  </p>
                </div>
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
                  <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/30">
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
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-lg bg-card border-border shadow-lg rounded-[4px] h-full w-full max-h-full sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-lg flex flex-col p-0 sm:p-6 fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-[4px]">
          {selectedNode && (
            <>
              <div className="flex-1 overflow-y-auto px-4 pr-12 sm:pr-4 sm:px-0 pb-4 sm:pb-0">
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
                      {selectedNode.status === "matched" && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl">{selectedNode.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.role} @ {selectedNode.company}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedNode.compatibility && (
                          <Badge className="bg-green-500/10 text-green-500">{selectedNode.compatibility}% Match</Badge>
                        )}
                        <Badge variant="secondary" className="capitalize">
                          {selectedNode.status}
                        </Badge>
                      </div>
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

                {selectedNode.compatibility && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Compatibility Breakdown</h4>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Relevance</span>
                          <span>{Math.round(selectedNode.compatibility * 0.98)}%</span>
                        </div>
                        <Progress value={selectedNode.compatibility * 0.98} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reciprocity</span>
                          <span>{Math.round(selectedNode.compatibility * 0.92)}%</span>
                        </div>
                        <Progress value={selectedNode.compatibility * 0.92} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tone Match</span>
                          <span>{Math.round(selectedNode.compatibility * 1.02)}%</span>
                        </div>
                        <Progress value={Math.min(selectedNode.compatibility * 1.02, 100)} className="h-2" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4 sm:pb-0">
                  <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Calendar className="w-4 h-4" />
                    Book Coffee Chat
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                    <MessageSquare className="w-4 h-4" />
                    View Simulation
                  </Button>
                </div>
              </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
