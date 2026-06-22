import { createBrowserClient } from "@supabase/ssr"
import { createDemoClient } from "./demo-client"
import { isDemoAuthEnabled } from "./demo-mode"

export function createClient() {
  if (isDemoAuthEnabled()) {
    return createDemoClient()
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
