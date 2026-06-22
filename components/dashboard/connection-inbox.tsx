"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { PROFILES } from "./mock-profiles"
import {
  ArrowRight,
  Bell,
  Clock3,
  Filter,
  Inbox,
  MessageSquare,
  Search,
  Sparkles,
  UserPlus,
  Zap,
  CheckCircle2,
  MailOpen,
} from "lucide-react"

type InboxCategory = "all" | "priority" | "matches" | "requests" | "follow-ups"

type InboxItem = {
  id: string
  category: InboxCategory
  status: "new" | "read" | "action_required" | "archived"
  actor: string
  title: string
  summary: string
  detail: string
  time: string
  unread: boolean
  profileName: string
  highlight: string
  suggestedReply: string
  nextAction: string
  timeline: Array<{ label: string; detail: string }>
  tags: string[]
}

const inboxItems: InboxItem[] = [
  {
    id: "sarah-chen",
    category: "matches",
    status: "new",
    actor: "Sarah Chen",
    title: "High-signal match ready",
    summary: "Your agent found a strong overlap on scaling systems and hiring philosophy.",
    detail:
      "Sarah opened with a fast reply, asked for architecture context, and is already leaning toward a deeper intro. This is one of the strongest signals in the queue.",
    time: "3 min ago",
    unread: true,
    profileName: "Sarah Chen",
    highlight: "94% compatibility with a clear follow-up path",
    suggestedReply:
      "Hey Sarah, your profile lines up unusually well with what we're building. If you're open to it, I can send a concise intro packet and propose a 15-minute coffee chat this week.",
    nextAction: "Draft and send a coffee chat invite while the thread is still hot.",
    timeline: [
      { label: "Agent match", detail: "Systems design, hiring, and startup scale all overlapped." },
      { label: "Reply", detail: "Sarah responded within 12 minutes with architecture questions." },
      { label: "Recommendation", detail: "Convert to a mutual intro before the momentum cools." },
    ],
    tags: ["high priority", "warm lead", "mutual interest"],
  },
  {
    id: "marcus-reed",
    category: "priority",
    status: "action_required",
    actor: "Marcus Reed",
    title: "Coffee chat accepted",
    summary: "Marcus is open to a short call and asked for more context on your product.",
    detail:
      "The match is already moving forward. Marcus accepted the intro and wants a clearer sense of the product, which makes this a strong candidate for a direct reply.",
    time: "18 min ago",
    unread: true,
    profileName: "Marcus Reed",
    highlight: "87% compatibility and active scheduling intent",
    suggestedReply:
      "Appreciate it, Marcus. I’ll send over a short summary and two time windows so we can keep it lightweight and useful.",
    nextAction: "Offer two time slots and keep the reply under 120 words.",
    timeline: [
      { label: "Match found", detail: "Shared React, TypeScript, and product-thinking signals." },
      { label: "Acceptance", detail: "Marcus accepted the coffee chat prompt without friction." },
      { label: "Open loop", detail: "Need to send a short scheduling reply." },
    ],
    tags: ["action required", "scheduling", "fast follow-up"],
  },
  {
    id: "chris-patel",
    category: "follow-ups",
    status: "read",
    actor: "Chris Patel",
    title: "Reply received on intro packet",
    summary: "Chris replied with a follow-up question on pricing and early traction.",
    detail:
      "This thread is moving in the right direction. The conversation is already specific, which means the inbox should keep it near the top until you respond.",
    time: "54 min ago",
    unread: false,
    profileName: "Chris Patel",
    highlight: "Investor curiosity + concrete product questions",
    suggestedReply:
      "Thanks, Chris. I can share a short note on traction and the beta workflow if that helps give the context you need.",
    nextAction: "Reply with two bullets of traction and a crisp ask.",
    timeline: [
      { label: "Intro sent", detail: "The first pass focused on the IDE-first workflow." },
      { label: "Question", detail: "Chris asked about early numbers and GTM positioning." },
      { label: "Follow-up", detail: "The thread is a good candidate for a more precise answer." },
    ],
    tags: ["follow-up", "investor", "product signal"],
  },
  {
    id: "emma-wilson",
    category: "requests",
    status: "new",
    actor: "Emma Wilson",
    title: "Intro request pending",
    summary: "Emma asked for more detail before she decides whether to connect.",
    detail:
      "The reply is not a rejection, but it does need more context. A concise explanation of the product should keep the conversation alive without overcommitting.",
    time: "2 hrs ago",
    unread: true,
    profileName: "Emma Wilson",
    highlight: "Moderate fit, but the thread needs better positioning",
    suggestedReply:
      "Totally fair, Emma. I can send a short summary of the product and the kind of introductions it’s designed to create so you can decide quickly.",
    nextAction: "Send a shorter product summary and ask for a quick yes/no.",
    timeline: [
      { label: "Request opened", detail: "Emma viewed the profile and asked for more context." },
      { label: "Status", detail: "Still warm, but not yet ready to convert." },
      { label: "Recommendation", detail: "Use a shorter reply and keep the ask simple." },
    ],
    tags: ["request", "needs context", "low friction"],
  },
  {
    id: "noah-brown",
    category: "priority",
    status: "archived",
    actor: "Noah Brown",
    title: "Connection moved to archive",
    summary: "Noah is a great profile, but the timing is not right for a live intro.",
    detail:
      "The inbox still keeps this around for reference, but the thread has cooled. No action is needed right now unless the user revisits the profile later.",
    time: "1 day ago",
    unread: false,
    profileName: "Noah Brown",
    highlight: "Excellent profile, low urgency",
    suggestedReply:
      "Thanks again, Noah. I’ll keep this on my radar and circle back when the timing is better.",
    nextAction: "Archive for now and revisit if there is a stronger opening later.",
    timeline: [
      { label: "Initial match", detail: "The overlap was strong on infrastructure and scale." },
      { label: "Cooldown", detail: "The thread went quiet after the initial reply." },
      { label: "State", detail: "Archived, but retained for future follow-up." },
    ],
    tags: ["archive", "cooling off", "keep for later"],
  },
]

const categoryCounts = inboxItems.reduce(
  (counts, item) => {
    counts.all += 1
    counts[item.category] += 1
    if (item.unread) {
      counts.unread += 1
    }
    if (item.status === "action_required") {
      counts.actionRequired += 1
    }
    return counts
  },
  { all: 0, priority: 0, matches: 0, requests: 0, "follow-ups": 0, unread: 0, actionRequired: 0 },
)

function resolveProfile(name: string) {
  return PROFILES.find((profile) => profile.name === name)
}

function getStatusIcon(status: InboxItem["status"]) {
  switch (status) {
    case "new":
      return <Sparkles className="w-3.5 h-3.5 text-teal-500" />
    case "action_required":
      return <Zap className="w-3.5 h-3.5 text-amber-500" />
    case "archived":
      return <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
    case "read":
      return <MailOpen className="w-3.5 h-3.5 text-primary" />
  }
}

export function ConnectionInbox() {
  const [filter, setFilter] = useState<InboxCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState(inboxItems[0]?.id || "")
  const [readIds, setReadIds] = useState<string[]>([])

  const filteredItems = inboxItems.filter((item) => {
    if (filter !== "all" && item.category !== filter) {
      return false
    }
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return true
    }
    return [item.actor, item.title, item.summary, item.detail, item.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query)
  })

  useEffect(() => {
    if (!filteredItems.length) {
      return
    }

    const stillVisible = filteredItems.some((item) => item.id === selectedId)
    if (!stillVisible) {
      setSelectedId(filteredItems[0].id)
    }
  }, [filter, searchQuery, filteredItems, selectedId])

  useEffect(() => {
    if (!selectedId) {
      return
    }
    const selectedItem = inboxItems.find((item) => item.id === selectedId)
    if (selectedItem && selectedItem.unread && !readIds.includes(selectedId)) {
      setReadIds((current) => [...current, selectedId])
    }
  }, [selectedId, readIds])

  const selectedItem = inboxItems.find((item) => item.id === selectedId) || filteredItems[0] || inboxItems[0]
  const selectedProfile = selectedItem ? resolveProfile(selectedItem.profileName) : undefined

  return (
    <Card className="border-border bg-card shadow-md overflow-hidden h-full min-h-180">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Inbox className="w-3.5 h-3.5" />
              Connection inbox
            </div>
            <CardTitle className="text-2xl font-semibold">High-signal notifications in one place</CardTitle>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Track replies, match alerts, and follow-ups without losing context. The inbox keeps warm conversations
              at the top so you can move faster on the ones that matter.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-105">
            <Badge variant="secondary" className="justify-between gap-2 rounded-full px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Unread
              </span>
              <span className="font-semibold tabular-nums">{categoryCounts.unread}</span>
            </Badge>
            <Badge className="justify-between gap-2 rounded-full bg-teal-500/10 px-3 py-2 text-xs text-teal-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Matches
              </span>
              <span className="font-semibold tabular-nums">{categoryCounts.matches}</span>
            </Badge>
            <Badge className="justify-between gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Action
              </span>
              <span className="font-semibold tabular-nums">{categoryCounts.actionRequired}</span>
            </Badge>
            <Badge variant="secondary" className="justify-between gap-2 rounded-full px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" />
                Updated
              </span>
              <span className="font-semibold">2m ago</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid min-h-155 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="border-r border-border/60 min-h-0">
            <div className="border-b border-border/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tabs value={filter} onValueChange={(value) => setFilter(value as InboxCategory)} className="w-full">
                  <TabsList className="grid h-auto w-full grid-cols-3 bg-secondary/50 p-1 sm:grid-cols-5">
                    <TabsTrigger value="all" className="px-2 py-2 text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="priority" className="px-2 py-2 text-xs">
                      Priority
                    </TabsTrigger>
                    <TabsTrigger value="matches" className="px-2 py-2 text-xs">
                      Matches
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="px-2 py-2 text-xs">
                      Requests
                    </TabsTrigger>
                    <TabsTrigger value="follow-ups" className="px-2 py-2 text-xs">
                      Follow-ups
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search names, signals, or tags"
                  className="pl-9 bg-secondary/50 border-border/60"
                />
              </div>
            </div>

            <ScrollArea className="h-127 lg:h-[calc(100%-112px)]">
              <div className="divide-y divide-border/60">
                {filteredItems.map((item) => {
                  const profile = resolveProfile(item.profileName)
                  const isSelected = selectedItem.id === item.id
                  const isUnread = item.unread && !readIds.includes(item.id)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "w-full text-left transition-colors hover:bg-secondary/40",
                        isSelected && "bg-secondary/60",
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={profile?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {item.actor
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 rounded-full border border-card bg-card p-0.5">
                              {getStatusIcon(item.status)}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn("truncate text-sm font-medium", isUnread && "text-foreground")}>{item.actor}</p>
                                  {isUnread && <span className="h-2 w-2 rounded-full bg-teal-500" />}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.title} • {item.time}
                                </p>
                              </div>
                              <Badge
                                variant={isSelected ? "default" : "secondary"}
                                className={cn(
                                  "shrink-0 rounded-full text-[10px] uppercase tracking-wide",
                                  item.status === "action_required" && "bg-amber-500/10 text-amber-500",
                                  item.status === "new" && "bg-teal-500/10 text-teal-500",
                                )}
                              >
                                {item.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="rounded-full border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-3 rounded-full bg-secondary/60 p-3">
                      <Inbox className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No notifications match this filter</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Try a broader filter or clear the search term to surface the latest connection activity.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="min-h-0 p-4 sm:p-6">
            {selectedItem ? (
              <div className="flex h-full flex-col gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary">{selectedItem.highlight}</Badge>
                      {selectedItem.unread && !readIds.includes(selectedItem.id) && (
                        <Badge className="rounded-full bg-teal-500/10 text-teal-500">Unread</Badge>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{selectedItem.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedItem.summary}</p>
                    </div>
                  </div>

                  <Button variant="outline" className="gap-2 rounded-full">
                    Open profile
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] min-h-0 flex-1">
                  <div className="space-y-4">
                    <Card className="border-border/60 bg-secondary/20 shadow-none">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">Why this matters</CardTitle>
                          <Badge variant="secondary" className="rounded-full">
                            <Filter className="mr-1 h-3 w-3" />
                            {selectedItem.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <p className="text-sm leading-6 text-muted-foreground">{selectedItem.detail}</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {selectedItem.timeline.map((step) => (
                            <div key={step.label} className="rounded-xl border border-border/60 bg-card px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{step.label}</p>
                              <p className="mt-1 text-xs leading-5 text-foreground/90">{step.detail}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Suggested reply</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                          <p className="text-sm leading-6 text-foreground/90">{selectedItem.suggestedReply}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button className="gap-2 rounded-full">
                            <MessageSquare className="h-4 w-4" />
                            Draft reply
                          </Button>
                          <Button variant="outline" className="gap-2 rounded-full">
                            <UserPlus className="h-4 w-4" />
                            Schedule intro
                          </Button>
                          <Button variant="ghost" className="rounded-full text-muted-foreground">
                            Snooze 24h
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/60 bg-card shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Contact context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedProfile?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {selectedItem.actor
                                .split(" ")
                                .map((part) => part[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium">{selectedItem.actor}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedProfile?.role || "Professional"} @ {selectedProfile?.company || "Independent"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-secondary/30 p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Next action</p>
                          <p className="mt-1 text-sm leading-6">{selectedItem.nextAction}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Key signals</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="rounded-full border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        {selectedItem.timeline.map((step, index) => (
                          <div key={step.label} className="flex gap-3">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{step.label}</p>
                              <p className="text-sm text-muted-foreground">{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-12 text-center">
                <div className="max-w-sm space-y-3">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No notification selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a connection notification from the inbox to inspect the signal, suggested response, and next step.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}