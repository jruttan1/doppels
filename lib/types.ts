export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  headline: string | null
  location: string | null
  avatar_url: string | null
  linkedin_url: string | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export interface SoulFile {
  id: string
  user_id: string
  skills: string[]
  experience: Experience[]
  education: Education[]
  voice_signature: VoiceSignature
  vibe_check_raw: string | null
  objectives: string[]
  system_prompt: string | null
  filters: GatekeeperFilters
  status: "draft" | "active" | "paused"
  created_at: string
  updated_at: string
}

export interface Experience {
  title: string
  company: string
  duration: string
  description?: string
}

export interface Education {
  degree: string
  institution: string
  year: string
}

export interface VoiceSignature {
  tone?: string
  formality?: string
  characteristics?: string[]
}

export interface GatekeeperFilters {
  location?: string[]
  skills?: string[]
  experience_years?: number
  industries?: string[]
}

export interface Connection {
  id: string
  user_a_id: string
  user_b_id: string
  status: "pending" | "simulated" | "matched" | "rejected" | "connected"
  compatibility_score: number | null
  relevance_score: number | null
  reciprocity_score: number | null
  tone_match_score: number | null
  conversation_snapshot: string | null
  talking_points: string[]
  icebreaker: string | null
  simulated_at: string | null
  matched_at: string | null
  connected_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  user_a?: Profile
  user_b?: Profile
}

export interface Simulation {
  id: string
  connection_id: string
  initiator_id: string
  receiver_id: string
  transcript: TranscriptMessage[]
  total_turns: number
  terminated_early: boolean
  termination_reason: string | null
  judge_evaluation: JudgeEvaluation | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface TranscriptMessage {
  role: "agent_a" | "agent_b"
  content: string
  timestamp: string
}

export interface JudgeEvaluation {
  relevance: number
  reciprocity: number
  tone_match: number
  overall: number
  summary: string
  recommendation: "match" | "no_match" | "uncertain"
}

export interface Document {
  id: string
  user_id: string
  type: "resume" | "linkedin" | "portfolio" | "other"
  file_name: string | null
  file_url: string | null
  extracted_data: Record<string, unknown> | null
  created_at: string
}

// Onboarding objectives
export const OBJECTIVES = [
  { id: "find_cofounder", label: "Find a Co-founder", icon: "users" },
  { id: "hire_talent", label: "Hire Talent", icon: "briefcase" },
  { id: "find_job", label: "Find a Job", icon: "search" },
  { id: "angel_investing", label: "Angel Investing", icon: "trending-up" },
  { id: "seek_funding", label: "Seek Funding", icon: "dollar-sign" },
  { id: "find_mentors", label: "Find Mentors", icon: "compass" },
  { id: "industry_networking", label: "Industry Networking", icon: "globe" },
  { id: "find_advisors", label: "Find Advisors", icon: "lightbulb" },
] as const

// Onboarding data structure (used during wizard flow) - matches JSON schema
export interface SoulFileData {
  // Identity (may be pre-filled from profile)
  identity?: {
    name?: string
    headline?: string
    location?: string
  }
  // Skills
  skills_possessed: string[]
  skills_desired: string[]
  // Networking goals (free text)
  networking_goals: string[]
  // Raw assets
  raw_assets: {
    voice_snippet: string
  }
  // Filters (for gatekeeper)
  filters: {
    locations: string[]
  }
  // Hiring preferences (shown if user is hiring/looking for cofounder)
  isHiring?: boolean
  hiringSkillsDesired?: string[]
  hiringLocationsDesired?: string[]
  // Legacy fields for backward compatibility
  documents?: { name: string; type: string }[]
  linkedinUrl?: string
  githubUrl?: string
  vibeCheck?: string // Maps to raw_assets.voice_snippet
  objectives?: string[] // Maps to networking_goals
  // Base64 encoded PDFs (for server-side parsing)
  resumeBase64?: string
  linkedinBase64?: string
}
