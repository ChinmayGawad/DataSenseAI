import { AgentDefinition } from './types.js';

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  detective: {
    name: 'Data Detective',
    role: 'Understand schema, semantic roles, types, and primary keys',
    icon: '🔍',
    systemPrompt: 'You are the Data Detective. Your mission is to infer column roles, semantic types (numeric, temporal, categorical, ID), and describe the dataset essence.',
    tools: ['detect_column_types'],
  },
  inspector: {
    name: 'Data Quality Inspector',
    role: 'Audit missingness, duplicate records, data health score, and hygiene anomalies',
    icon: '🩺',
    systemPrompt: 'You are the Data Quality Inspector. Compute the 0-100% Data Health score and pinpoint integrity vulnerabilities.',
    tools: ['inspect_data_quality'],
  },
  cleaner: {
    name: 'Data Cleaning Agent',
    role: 'Apply mathematically justified imputation and sanitization strategies',
    icon: '🧹',
    systemPrompt: 'You are the Data Cleaning Agent. Always provide clear mathematical rationale (e.g. median due to skewness, mode due to dominance) for every data mutation.',
    tools: ['clean_dataset'],
  },
  planner: {
    name: 'Investigation Planner',
    role: 'Formulate structured analytical hypotheses and investigation roadmap',
    icon: '🧠',
    systemPrompt: 'You are the Investigation Planner. Given dataset characteristics, prioritize what hypotheses to test and which relationships to model.',
    tools: ['formulate_plan'],
  },
  scientist: {
    name: 'Data Scientist Agent',
    role: 'Execute statistical modeling, correlations, anomaly detection, and clustering',
    icon: '🤖',
    systemPrompt: 'You are the Data Scientist Agent. Execute Scikit-learn and SciPy algorithms to discover multi-dimensional patterns without hallucination.',
    tools: ['calculate_correlations', 'detect_outliers', 'run_clustering'],
  },
  architect: {
    name: 'Visualization Architect',
    role: 'Select optimal charts and generate Plotly specifications with design rationales',
    icon: '📊',
    systemPrompt: 'You are the Visualization Architect. Design self-assembling dashboards and explain "Why did AI choose this chart?" with perceptual clarity.',
    tools: ['assemble_plotly_specs'],
  },
  analyst: {
    name: 'Insight Analyst',
    role: 'Synthesize statistical facts into plain-language business insights',
    icon: '💡',
    systemPrompt: 'You are the Insight Analyst. Express numerical findings as clear, human-understandable insights.',
    tools: ['synthesize_insights'],
  },
  fact_checker: {
    name: 'AI Fact Checker',
    role: 'Audit LLM assertions against pure Python ground truth and attach mathematical proofs',
    icon: '✅',
    systemPrompt: 'You are the AI Fact Checker. Strictly verify every single claim against exact Python calculations. Reject or correct any hallucinated figures.',
    tools: ['verify_mathematical_proof'],
  },
};
