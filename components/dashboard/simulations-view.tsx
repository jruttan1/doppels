"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Simulation {
  id: string
  targetName: string
  targetRole: string
  targetAvatar?: string
  status: "completed" | "in_progress" | "failed"
  score?: number
  turns: number
  startedAt: string
  completedAt?: string
  messages: { agent: "A" | "B"; message: string }[]
  summary?: string
}

const MOCK_SIMULATIONS: Simulation[] = [
  {
    id: "1",
    targetName: "Sarah Chen",
    targetRole: "CTO @ Fintech Startup",
    targetAvatar: "/woman-tech-executive.jpg",
    status: "completed",
    score: 94,
    turns: 6,
    startedAt: "2 hours ago",
    completedAt: "2 hours ago",
    messages: [
      {
        agent: "A",
        message:
          "Hey Sarah! I noticed you've built distributed systems at scale. I'm working on something similar at my startup and would love to exchange notes.",
      },
      {
        agent: "B",
        message:
          "Hi! Always happy to chat about distributed systems. What kind of scale are you dealing with? I've seen some interesting patterns at Fintech companies.",
      },
      {
        agent: "A",
        message:
          "We're processing about 10M events/day across 50+ microservices. The challenge is maintaining consistency while keeping latency under 50ms.",
      },
      {
        agent: "B",
        message:
          "That's a solid challenge! Have you considered event sourcing with CQRS? We used that pattern to handle 100M+ events. Happy to share our architecture docs.",
      },
      {
        agent: "A",
        message:
          "That would be incredibly helpful! We've been debating between CQRS and a more traditional approach. Would you be open to a quick call to dive deeper?",
      },
      { agent: "B", message: "I'd love to learn more about your use case too. Let's find a time this week." },
    ],
    summary:
      "Strong mutual interest in distributed systems. Both have experience at scale. Sarah offered to share architecture docs. Recommended for follow-up.",
  },
  {
    id: "2",
    targetName: "Chris Patel",
    targetRole: "Angel Investor",
    targetAvatar: "/man-investor-professional.jpg",
    status: "completed",
    score: 89,
    turns: 6,
    startedAt: "5 hours ago",
    completedAt: "5 hours ago",
    messages: [
      {
        agent: "A",
        message:
          "Hi Chris! I saw you've invested in several B2B SaaS companies in the developer tools space. We're building something in that area.",
      },
      { agent: "B", message: "Hi! Developer tools is definitely my sweet spot. What problem are you solving?" },
      {
        agent: "A",
        message:
          "We're building an AI-powered code review platform that integrates directly into the IDE. Think real-time suggestions, not just async PR reviews.",
      },
      {
        agent: "B",
        message:
          "Interesting positioning. The IDE-first approach is smart. What's your GTM strategy? I've seen many dev tools struggle with distribution.",
      },
      {
        agent: "A",
        message:
          "We're going PLG with a generous free tier, then enterprise upsell. Already have 2K developers using the beta daily.",
      },
      {
        agent: "B",
        message:
          "Those are compelling early numbers. I'd like to hear more about your unit economics and roadmap. Let's schedule a proper intro call.",
      },
    ],
    summary:
      "Chris is actively looking to invest in developer tools. Strong interest in the product and early traction. High likelihood of investment conversation.",
  },
  {
    id: "3",
    targetName: "Emma Wilson",
    targetRole: "Design Lead @ Agency",
    status: "completed",
    score: 52,
    turns: 4,
    startedAt: "8 hours ago",
    completedAt: "8 hours ago",
    messages: [
      {
        agent: "A",
        message:
          "Hi Emma! I'm building a dev tools startup and looking for someone to help establish our design system.",
      },
      {
        agent: "B",
        message:
          "Hi! I typically work with larger enterprise clients on design systems. What's your current team size and budget?",
      },
      {
        agent: "A",
        message: "We're a team of 5, mostly engineers. Budget is limited as we're pre-seed, but equity is available.",
      },
      {
        agent: "B",
        message:
          "I appreciate the offer, but I'm not looking for equity-heavy arrangements right now. Good luck with your search though!",
      },
    ],
    summary:
      "Misaligned on compensation expectations. Emma prefers cash-heavy enterprise engagements. Not a good fit at this stage.",
  },
  {
    id: "4",
    targetName: "Marcus Reed",
    targetRole: "Eng Lead @ Series B",
    targetAvatar: "/man-engineering-lead.jpg",
    status: "in_progress",
    turns: 3,
    startedAt: "30 min ago",
    messages: [
      {
        agent: "A",
        message:
          "Hey Marcus! I saw your blog post on scaling React applications. We're facing similar challenges at our startup.",
      },
      {
        agent: "B",
        message:
          "Thanks! That post got way more traction than I expected. What specific scaling issues are you running into?",
      },
      {
        agent: "A",
        message:
          "Mainly state management across complex forms and real-time collaboration features. We're debating between Redux and Zustand.",
      },
    ],
  },
  {
    id: "5",
    targetName: "Tom Brown",
    targetRole: "ML Engineer @ AI Lab",
    status: "failed",
    turns: 2,
    startedAt: "1 day ago",
    completedAt: "1 day ago",
    messages: [
      {
        agent: "A",
        message:
          "Hi Tom! I'm building an AI code review tool and would love to chat about ML architectures for code understanding.",
      },
      {
        agent: "B",
        message:
          "Sorry, I'm not taking any meetings or advisory roles right now. Focused on my research deadlines. Good luck!",
      },
    ],
    summary: "Target declined engagement. Currently unavailable for networking.",
  },
]

export function SimulationsView() {
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress" | "failed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)

  const filteredSimulations = MOCK_SIMULATIONS.filter((sim) => {
    if (filter !== "all" && sim.status !== filter) return false
    if (searchQuery && !sim.targetName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getStatusIcon = (status: Simulation["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      case "failed":
        return <XCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: Simulation["status"], score?: number) => {
    switch (status) {
      case "completed":
        return (
          <Badge className={score && score >= 70 ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}>
            {score}% Match
          </Badge>
        )
      case "in_progress":
        return <Badge className="bg-yellow-500/10 text-yellow-500 animate-pulse">In Progress</Badge>
      case "failed":
        return <Badge variant="secondary">No Match</Badge>
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">All ({MOCK_SIMULATIONS.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search simulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-64 bg-secondary/50"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSimulations.map((simulation) => (
          <Card
            key={simulation.id}
            className="bg-card border-border shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedSimulation(simulation)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={simulation.targetAvatar || "/placeholder.svg?height=48&width=48&query=professional headshot"}
                    />
                    <AvatarFallback>
                      {simulation.targetName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">{getStatusIcon(simulation.status)}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{simulation.targetName}</h3>
                    {getStatusBadge(simulation.status, simulation.score)}
                  </div>
                  <p className="text-sm text-muted-foreground">{simulation.targetRole}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {simulation.turns} turns
                    </span>
                    <span>{simulation.startedAt}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {simulation.summary && (
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2 pl-16">{simulation.summary}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulation detail dialog */}
      <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-lg rounded-[4px] h-full w-full max-h-full sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-2xl flex flex-col p-0 sm:p-6 fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-[4px]">
          {selectedSimulation && (
            <>
              <div className="flex-1 overflow-y-auto px-4 pr-12 sm:pr-4 sm:px-0 pb-4 sm:pb-0">
                <DialogHeader className="pt-6 sm:pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Your Agent</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          selectedSimulation.targetAvatar ||
                          "/placeholder.svg?height=40&width=40&query=professional headshot"
                        }
                      />
                      <AvatarFallback>
                        {selectedSimulation.targetName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedSimulation.targetName}</p>
                      <p className="text-xs text-muted-foreground">{selectedSimulation.targetRole}</p>
                    </div>
                  </div>
                  <div className="ml-auto">{getStatusBadge(selectedSimulation.status, selectedSimulation.score)}</div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[400px] pr-4 mt-4">
                <div className="space-y-4">
                  {selectedSimulation.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.agent === "A" ? "" : "flex-row-reverse"}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.agent === "A" ? "bg-primary/20" : "bg-secondary"
                        }`}
                      >
                        {msg.agent === "A" ? (
                          <Bot className="w-4 h-4 text-primary" />
                        ) : (
                          <span className="text-xs font-medium">
                            {selectedSimulation.targetName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.agent === "A"
                            ? "bg-primary/10 border border-primary/20 rounded-tl-none"
                            : "bg-secondary rounded-tr-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {selectedSimulation.status === "in_progress" && (
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium">
                          {selectedSimulation.targetName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="bg-secondary p-4 rounded-2xl rounded-tr-none">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {selectedSimulation.summary && (
                <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium">AI Summary</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedSimulation.summary}</p>
                </div>
              )}

              {selectedSimulation.status === "completed" &&
                selectedSimulation.score &&
                selectedSimulation.score >= 70 && (
                  <div className="flex gap-3 mt-4 pb-4 sm:pb-0">
                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                      Book Coffee Chat
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      Save for Later
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
