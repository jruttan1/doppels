import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/shell"
import { ConnectionInbox } from "@/components/dashboard/connection-inbox"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { NetworkGraph } from "@/components/dashboard/network-graph"
import { StatsCards } from "@/components/dashboard/stats-cards"

export const metadata = {
  title: "Dashboard | Doppels",
  description: "Your agent networking dashboard",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("ingestion_status")
    .eq("id", user.id)
    .single()

  // Redirect to onboarding if not complete
  if (!profile || profile.ingestion_status !== "complete") {
    // If they're in the middle of processing, send to creating page
    if (profile?.ingestion_status === "processing") {
      redirect("/creating")
    }
    // Otherwise send to onboarding
    redirect("/onboarding")
  }

  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-4 overflow-hidden p-4 sm:p-6 lg:p-6">
        <div className="flex-shrink-0 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-medium bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Your Doppel is exploring. Here&apos;s what it&apos;s found so far.
              </p>
            </div>

            <Button asChild variant="outline" className="w-fit rounded-full">
              <Link href="#connection-inbox">Jump to inbox</Link>
            </Button>
          </div>
        </div>

        <div className="flex-shrink-0">
          <StatsCards />
        </div>

        <div id="connection-inbox" className="flex-1 min-h-0 overflow-hidden">
          <ConnectionInbox />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] flex-shrink-0 min-h-[420px]">
          <div className="min-h-0 overflow-hidden rounded-2xl border border-border bg-card/40 p-3 shadow-sm">
            <NetworkGraph />
          </div>
          <RecentActivity />
        </div>
      </div>
    </DashboardShell>
  )
}
