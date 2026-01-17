import { DashboardShell } from "@/components/dashboard/shell"
import { NetworkFullView } from "@/components/dashboard/network-full-view"

export const metadata = {
  title: "Network | Doppel",
  description: "Explore your full network",
}

export default function NetworkPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Your Network</h1>
          <p className="text-muted-foreground">Explore all your connections and discover new potential matches.</p>
        </div>
        <NetworkFullView />
      </div>
    </DashboardShell>
  )
}
