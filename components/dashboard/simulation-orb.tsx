"use client"

import { useMemo } from "react"
import Orb from "@/components/landing/orb"

export type SimulationPhase = "connecting" | "chatting" | "analyzing" | "done"

interface SimulationOrbProps {
  phase: SimulationPhase
}

const PHASE_CONFIG: Record<SimulationPhase, { hue: number; intensity: number }> = {
  connecting: { hue: 220, intensity: 0.25 },
  chatting: { hue: 170, intensity: 0.4 },
  analyzing: { hue: 40, intensity: 0.35 },
  done: { hue: 140, intensity: 0.2 },
}

export function SimulationOrb({ phase }: SimulationOrbProps) {
  const config = useMemo(() => PHASE_CONFIG[phase], [phase])

  return (
    <div className="relative w-32 h-32 transition-all duration-[2000ms] ease-in-out">
      <Orb
        hue={config.hue}
        hoverIntensity={config.intensity}
        forceHoverState={phase === "chatting" || phase === "analyzing"}
        rotateOnHover={phase !== "done"}
        backgroundColor="#000000"
      />
    </div>
  )
}
