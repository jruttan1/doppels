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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 space-y-4 mb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Dashboard
            </h1>
            <p className="text-muted-foreground">Your Doppel is exploring. Here&apos;s what it&apos;s found so far.</p>
          </div>
          <AgentStatus />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Network Map</h2>
            <div className="flex-1 min-h-0">
              <NetworkGraph />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
