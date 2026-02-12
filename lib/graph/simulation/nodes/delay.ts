import type { SimulationStateType } from '../state';

// Delay range in milliseconds - keep short for serverless (60s timeout)
// The UI handles display timing separately
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 1000;

/**
 * Node: Introduce a natural delay between conversation turns.
 * Makes the experience feel premium - like agents are actually thinking.
 */
export async function delayNode(
  _state: SimulationStateType
): Promise<Partial<SimulationStateType>> {
  // Random delay within range for natural feel
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

  await new Promise((resolve) => setTimeout(resolve, delay));

  // No state changes - this is a timing node only
  return {};
}
