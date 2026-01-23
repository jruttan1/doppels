import { Annotation } from '@langchain/langgraph';
import type { AgentConfig, TranscriptEntry, AnalysisResult } from './types';

/**
 * State schema for the simulation graph using LangGraph Annotation.
 *
 * The `transcript` field uses an append reducer to accumulate messages.
 * All other fields use replace semantics (last value wins).
 */
export const SimulationState = Annotation.Root({
  // Database link - CRITICAL for persistence
  simulationId: Annotation<string>(),

  // Agent configurations (immutable during run)
  agentA: Annotation<AgentConfig>(),
  agentB: Annotation<AgentConfig>(),

  // Conversation state
  transcript: Annotation<TranscriptEntry[]>({
    reducer: (current, update) => [...(current || []), ...(update || [])],
    default: () => [],
  }),

  currentTurn: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),

  nextSpeaker: Annotation<'A' | 'B'>({
    reducer: (_, update) => update,
    default: () => 'A',
  }),

  lastMessage: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Termination state
  isActive: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => true,
  }),

  terminationReason: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Analysis results (populated at end)
  analysis: Annotation<AnalysisResult | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Error tracking
  error: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Configuration
  maxTurns: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 15,
  }),
});

// Export the state type for use in nodes
export type SimulationStateType = typeof SimulationState.State;
