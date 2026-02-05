import { DashboardShell } from "@/components/dashboard/shell"
import { NetworkGraph } from "@/components/dashboard/network-graph"
import { Orchestrator } from "@/components/dashboard/orchestrator"

export const metadata = {
  title: "Dashboard | Doppels",
  description: "Your agent networking dashboard",
}

export default async function DashboardPage() {

  return (
    <DashboardShell>
      <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6 lg:p-6">
        <div className="flex-shrink-0 mb-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-medium bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              Your Doppel is exploring. Here&apos;s what it&apos;s found so far.
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <NetworkGraph />
        </div>

        <div className="flex-shrink-0 h-[55vh] max-h-[400px] mt-3">
          <Orchestrator />
        </div>
      </div>
    </DashboardShell>
  )
}
