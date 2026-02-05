/**
 * Agent persona structure from the database
 */
export interface AgentPersona {
  id: string;
  name: string;
  identity?: {
    name?: string;
    tagline?: string;
    location?: string;
  };
  networking_goals?: string[];
  skills_possessed?: string[];
  skills_desired?: string[];
  raw_assets?: {
    voice_snippet?: string;
    experience_log?: string[];
    project_list?: string[];
    interests?: string[];
  };
  [key: string]: any;
}

/**
 * Agent configuration passed to the graph
 */
export interface AgentConfig {
  id: string;
  name: string;
  persona: AgentPersona;
}

/**
 * A single entry in the conversation transcript
 */
export interface TranscriptEntry {
  speaker: string;
  id: string;
  text: string;
  timestamp: string;
}

/**
 * Analysis result from Gemini
 */
export interface AnalysisResult {
  score: number;
  takeaways: string[];
}

/**
 * A single thought entry from the user's agent
 */
export interface ThoughtEntry {
  text: string;
  turnNumber: number;
  timestamp: string;
}

/**
 * Result of a single simulation run
 */
export interface SimulationResult {
  partnerId: string;
  partnerName?: string;
  success: boolean;
  score?: number;
  simulationId?: string;
  error?: string;
}
