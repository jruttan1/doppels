import type { SimulationStateType } from '../state';

// Delay range in milliseconds for a premium "thinking" feel
const MIN_DELAY_MS = 2500;
const MAX_DELAY_MS = 4500;

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
