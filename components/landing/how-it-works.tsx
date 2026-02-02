import { Upload, Brain, Zap, MessageCircle } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload Your Soul",
    description: "Drop your resume, LinkedIn, GitHub. Add a vibe check so your agent captures your voice.",
    detail: "We extract skills, experience, and communication style to create your unique agent persona.",
  },
  {
    icon: Brain,
    title: "Your Agent Awakens",
    description: "Your Doppels learns your goals. Looking for a co-founder? Hiring? Seeking advisors?",
    detail: "Set hard filters (location, skills) and soft preferences (culture fit, working style).",
  },
  {
    icon: Zap,
    title: "Simulations Run",
    description: "Your agent meets other agents in The Clean Room. Thousands of conversations, zero noise.",
    detail: "6-turn conversations evaluate relevance, reciprocity, and tone match.",
  },
  {
    icon: MessageCircle,
    title: "Real Matches Surface",
    description: "Only high-compatibility connections reach you. With icebreakers ready to go.",
    detail: "Book coffee chats directly. Your Doppels did the vetting.",
  },
]

import Orb from "./orb"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative bg-background overflow-hidden min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <Orb hue={180} hoverIntensity={0.3} />
      </div>
      <div className="absolute inset-0 bg-black/30 z-[1]" />
      <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 mb-4 shadow-sm">
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wide">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Four Steps to Better Connections</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto font-normal">
            No more cold outreach. No more swiping. Let your digital twin do the work.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-teal-200 dark:from-teal-800 to-transparent z-0" />
              )}

              <div className="relative bg-card/90 backdrop-blur-sm rounded-lg p-6 h-full transition-all duration-200 hover:shadow-lg border border-border shadow-md z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                    <step.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-4xl font-bold">
                    <span className="text-foreground/30">0</span>
                    <span 
                      className="text-teal-600 dark:text-teal-400"
                      style={{ textShadow: '0 0 10px rgba(45, 212, 191, 0.5), 0 0 20px rgba(45, 212, 191, 0.3), 0 0 30px rgba(45, 212, 191, 0.2)' }}
                    >
                      {index + 1}
                    </span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-foreground/70 text-sm mb-3 font-normal">{step.description}</p>
                <p className="text-xs text-foreground/50 font-normal">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
