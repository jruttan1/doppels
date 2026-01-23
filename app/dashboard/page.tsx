import { DashboardShell } from "@/components/dashboard/shell"
import { NetworkGraph } from "@/components/dashboard/network-graph"
import { ConnectionsList } from "@/components/dashboard/connections-list"
import { AgentStatus } from "@/components/dashboard/agent-status"

export const metadata = {
  title: "Dashboard | Doppel",
  description: "Your agent networking dashboard",
}

export default async function DashboardPage() {

  return (
    <DashboardShell>
      <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6 lg:p-6">
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-medium bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mb-3">
                Your Doppel is exploring. Here&apos;s what it&apos;s found so far.
              </p>
            </div>
          </div>
          <div className="mb-2">
            <AgentStatus />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium mb-3">Network Map</h2>
            <div className="flex-1 min-h-0">
              <NetworkGraph />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}