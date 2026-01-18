import { DashboardShell } from "@/components/dashboard/shell"
import { NetworkGraph } from "@/components/dashboard/network-graph"
import { ConnectionsList } from "@/components/dashboard/connections-list"
import { AgentStatus } from "@/components/dashboard/agent-status"
import { SimulationsView } from "@/components/dashboard/simulations-view"

export const metadata = {
  title: "Dashboard | Doppel",
  description: "Your agent networking dashboard",
}

export default async function DashboardPage() {

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Your Doppel is exploring. Here&apos;s what it&apos;s found so far.</p>
        </div>

        <AgentStatus />

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Network Map</h2>
            <NetworkGraph />
          </div>

          {/* Mobile: Stack connections and simulations */}
          <div className="lg:hidden space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Connections & Simulations</h2>
              <div className="space-y-6">
                <ConnectionsList />
                <SimulationsView />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
