import { StateGraph, START, END } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { SimulationState } from './state';
import {
  agentReplyNode,
  syncToDbNode,
  delayNode,
  generateThoughtNode,
  checkTerminationNode,
  analyzeConversationNode,
  persistFinalNode,
} from './nodes';
import { shouldContinueConversation } from './edges/router';

export function createSimulationGraph() {
  const graph = new StateGraph(SimulationState)
    // Add all nodes
    .addNode('agentReply', agentReplyNode)
    .addNode('syncToDb', syncToDbNode)
    .addNode('generateThought', generateThoughtNode)
    .addNode('delay', delayNode)
    .addNode('checkTermination', checkTerminationNode)
    .addNode('analyzeConversation', analyzeConversationNode)
    .addNode('persistFinal', persistFinalNode)

    // START → agentReply
    .addEdge(START, 'agentReply')

    // agentReply → syncToDb
    .addEdge('agentReply', 'syncToDb')

    // syncToDb → generateThought (thought appears immediately)
    .addEdge('syncToDb', 'generateThought')

    // generateThought → delay (user reads thought during pause)
    .addEdge('generateThought', 'delay')

    // delay → checkTermination
    .addEdge('delay', 'checkTermination')

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
