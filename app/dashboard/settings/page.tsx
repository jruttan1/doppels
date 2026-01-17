import { DashboardShell } from "@/components/dashboard/shell"
import { SettingsView } from "@/components/dashboard/settings-view"

export const metadata = {
  title: "Settings | Doppel",
  description: "Manage your Doppel settings",
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, agent behavior, and preferences.</p>
        </div>
        <SettingsView />
      </div>
    </DashboardShell>
  )
}
