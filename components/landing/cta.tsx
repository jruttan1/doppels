import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { VantaBackground } from "./vanta-background"

export function CTA() {
  return (
    <section className="relative py-24 bg-background overflow-hidden min-h-[400px] sm:min-h-[600px] flex items-center">
      <VantaBackground fixed={false} />
      <div className="absolute inset-0 bg-black/40 z-[1]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[2] w-full">
        <div className="relative bg-card/80 backdrop-blur-sm rounded-lg p-8 sm:p-12 lg:p-16 text-center border border-border shadow-lg">
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Stop Networking.
              <br />
              <span className="text-teal-600 dark:text-teal-400">Start Connecting.</span>
            </h2>

            <p className="text-lg text-foreground/70 max-w-xl mx-auto mb-8 text-pretty font-normal">
              Deploy your Doppels today. While you sleep, your agent is making introductions that would have taken you
              months to find.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg">
                  Create Your Doppels
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
