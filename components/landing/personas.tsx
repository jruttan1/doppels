import { Badge } from "@/components/ui/badge"
import { Rocket, Briefcase, Search } from "lucide-react"

const personas = [
  {
    icon: Rocket,
    title: "The Founder",
    quote: "I need a technical co-founder who ships fast and isn't afraid to break things.",
    pain: "Spent 6 months networking. Met 50 people. Found 0 real matches.",
    solution: "Doppel ran 2,000+ simulated intros in a week. Surfaced 3 perfect candidates.",
    hoverBg: "bg-amber-950/30",
  },
  {
    icon: Briefcase,
    title: "The Hiring Manager",
    quote: "I'm drowning in unqualified applicants. The good ones never respond.",
    pain: "Cold outreach gets 2% response rates. LinkedIn is a graveyard.",
    solution: "Only see candidates whose agents already confirmed mutual interest. No more ghosting.",
    hoverBg: "bg-stone-800/30",
  },
  {
    icon: Search,
    title: "The Builder",
    quote: "I want to find a company that actually wants me, not just spray and pray.",
    pain: "Applied to 200 jobs. Got 3 interviews. All were bad fits.",
    solution: "My Doppel pre-screens opportunities 24/7. I only talk to companies worth my time.",
    hoverBg: "bg-slate-800/30",
  },
]

export function Personas() {
  return (
    <section id="personas" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Use Cases
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Built for Ambitious Professionals</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re building, hiring, or job hunting — your Doppel works while you sleep.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="relative glass rounded-2xl p-8 overflow-hidden group hover:scale-[1.01] transition-transform"
            >
              <div
                className={`absolute inset-0 ${persona.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <persona.icon className="w-7 h-7 text-white/70" />
                </div>

                <h3 className="text-xl font-bold mb-4">{persona.title}</h3>

                <blockquote className="text-lg italic text-foreground/90 mb-6 border-l-2 border-white/20 pl-4">
                  &ldquo;{persona.quote}&rdquo;
                </blockquote>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">The Pain</p>
                    <p className="text-sm text-muted-foreground">{persona.pain}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/70 mb-1">With Doppel</p>
                    <p className="text-sm text-white/80">{persona.solution}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
