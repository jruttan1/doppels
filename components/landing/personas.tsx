import { Rocket, Briefcase, Search } from "lucide-react"
import Orb from "./orb"

const personas = [
  {
    icon: Rocket,
    title: "The Founder",
    quote: "I need a technical co-founder who ships fast and isn't afraid to break things.",
    pain: "Spent 6 months networking. Met 50 people. Found 0 real matches.",
    solution: "Doppels ran 2,000+ simulated intros in a week. Surfaced 3 perfect candidates.",
  },
  {
    icon: Briefcase,
    title: "The Hiring Manager",
    quote: "I'm drowning in unqualified applicants. The good ones never respond.",
    pain: "Cold outreach gets 2% response rates. LinkedIn is a graveyard.",
    solution: "Only see candidates whose agents already confirmed mutual interest. No more ghosting.",
  },
  {
    icon: Search,
    title: "The Builder",
    quote: "I want to find a company that actually wants me, not just spray and pray.",
    pain: "Applied to 200 jobs. Got 3 interviews. All were bad fits.",
    solution: "My Doppels pre-screens opportunities 24/7. I only talk to companies worth my time.",
  },
]

export function Personas() {
  return (
    <section id="personas" className="py-24 relative bg-background overflow-hidden min-h-[400px] sm:min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <Orb hue={30} hoverIntensity={0.3} />
      </div>
      <div className="absolute inset-0 bg-black/30 z-[1]" />
      <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 mb-4 shadow-sm">
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wide">Use Cases</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Built for Ambitious Professionals</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto font-normal">
            Whether you&apos;re building, hiring, or job hunting — your Doppels works while you sleep.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="relative bg-card/90 backdrop-blur-sm rounded-lg p-6 h-full transition-all duration-200 hover:shadow-lg border border-border shadow-md"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                  <persona.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{persona.title}</h3>

              <blockquote className="text-sm italic text-foreground/90 mb-4 border-l-2 border-teal-200 dark:border-teal-800 pl-4">
                &ldquo;{persona.quote}&rdquo;
              </blockquote>

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">The Pain</p>
                  <p className="text-sm text-foreground/70 font-normal">{persona.pain}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground/50 mb-1">With Doppels</p>
                  <p className="text-xs text-foreground/50 font-normal">{persona.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
