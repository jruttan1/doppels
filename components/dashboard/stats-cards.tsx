"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Zap, CheckCircle2, Clock, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Total Explored",
    value: 1247,
    change: "+89 today",
    trend: 7.2,
    icon: Users,
  },
  {
    label: "Simulations Run",
    value: 342,
    change: "+23 today",
    trend: 12.5,
    icon: Zap,
  },
  {
    label: "High Matches",
    value: 28,
    change: "+4 this week",
    trend: 16.7,
    icon: CheckCircle2,
  },
  {
    label: "Pending Review",
    value: 12,
    change: "Ready for you",
    trend: 0,
    icon: Clock,
  },
]

export function StatsCards() {
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0))

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      setAnimatedValues(
        stats.map((stat) => {
          const progress = Math.min(step / steps, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
          return Math.round(stat.value * eased)
        }),
      )
      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={stat.label} className="bg-card border-border group hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-teal-500 dark:text-teal-400 group-hover:scale-110 transition-transform" />
              {stat.trend > 0 && (
                <div className="flex items-center gap-1 text-xs text-teal-500">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}%
                </div>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold mb-1 tabular-nums">{animatedValues[index].toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-primary mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
