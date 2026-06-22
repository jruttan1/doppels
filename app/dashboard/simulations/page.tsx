import { DashboardShell } from "@/components/dashboard/shell"
import { SimulationsView } from "@/components/dashboard/simulations-view"

export const metadata = {
  title: "Simulations | Doppel",
  description: "View all agent simulations",
}

export default function SimulationsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Simulations</h1>
          <p className="text-muted-foreground">Review conversations your Doppel has had with other agents.</p>
        </div>
        <SimulationsView />
      </div>
    </DashboardShell>
  )
}
