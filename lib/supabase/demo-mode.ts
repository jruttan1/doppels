export function isDemoAuthEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_AUTH === "true"
}