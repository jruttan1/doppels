import { StateGraph, START, END } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { SimulationState } from './state';
import {
  agentReplyNode,
  syncToDbNode,
  generateThoughtNode,
  checkTerminationNode,
  analyzeConversationNode,
  persistFinalNode,
} from './nodes';
import { shouldContinueConversation } from './edges/router';

/**
 * Create the simulation StateGraph.
 *
 * Graph topology:
 * START → agentReply → syncToDb → generateThought → checkTermination → [routing]
 *                                                                       ↓
 *                                                             continue → (loop back to agentReply)
 *                                                             analyze → analyzeConversation → persistFinal → END
 */
export function createSimulationGraph() {
  const graph = new StateGraph(SimulationState)
    // Add all nodes
    .addNode('agentReply', agentReplyNode)
    .addNode('syncToDb', syncToDbNode)
    .addNode('generateThought', generateThoughtNode)
    .addNode('checkTermination', checkTerminationNode)
    .addNode('analyzeConversation', analyzeConversationNode)
    .addNode('persistFinal', persistFinalNode)

    // START → agentReply
    .addEdge(START, 'agentReply')

    // agentReply → syncToDb
    .addEdge('agentReply', 'syncToDb')

    // syncToDb → generateThought
    .addEdge('syncToDb', 'generateThought')

    // generateThought → checkTermination
    .addEdge('generateThought', 'checkTermination')

    // Conditional routing from checkTermination
    .addConditionalEdges('checkTermination', shouldContinueConversation, {
      continue: 'agentReply',
      analyze: 'analyzeConversation',
    })

    // analyzeConversation → persistFinal
    .addEdge('analyzeConversation', 'persistFinal')

    // persistFinal → END
    .addEdge('persistFinal', END);

  return graph;
}

/**
 * Compile the simulation graph with optional checkpointer.
 */
export function compileSimulationGraph(options?: {
  checkpointer?: BaseCheckpointSaver;
}) {
  const graph = createSimulationGraph();

  return graph.compile({
    checkpointer: options?.checkpointer,
  });
}

// Type for the compiled graph
export type SimulationGraph = ReturnType<typeof compileSimulationGraph>;
