export interface AgentDefinition {
  name: string;
  role: string;
  icon: string;
  systemPrompt: string;
  tools: string[];
}

export interface AgentExecutionContext {
  jobId: string;
  datasetPath: string;
  datasetName: string;
  currentStep: number;
  metadata?: Record<string, any>;
  artifacts: Record<string, any>;
}

export interface AgentExecutionResult {
  agentName: string;
  icon: string;
  status: 'completed' | 'failed' | 'warning';
  output: Record<string, any>;
  reasoning: string;
  durationMs: number;
}
