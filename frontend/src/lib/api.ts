/**
 * DataSense AI - Frontend API Client & Type Definitions
 * Connects Next.js to the FastAPI backend service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  file_format: string;
  created_at: string;
  message: string;
}

export interface AgentLogItem {
  id: string;
  job_id: string;
  agent_name: string;
  agent_icon: string;
  step_title: string;
  description: string;
  status: 'in_progress' | 'completed' | 'warning' | 'failed';
  details: Record<string, any>;
  duration_ms?: number;
  created_at: string;
}

export interface InvestigationPlanItem {
  step_number: number;
  question: string;
  analysis_type: string;
  target_columns: string[];
  rationale: string;
  priority: string;
}

export interface JobStatusResponse {
  job_id: string;
  dataset_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  current_agent?: string;
  progress_percentage: number;
  health_score?: number;
  summary?: string;
  error_message?: string;
  logs: AgentLogItem[];
  plan: InvestigationPlanItem[];
  updated_at: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  chart_type: string;
  x_axis: string;
  y_axis?: string;
  color_by?: string;
  plotly_data: any[];
  plotly_layout: Record<string, any>;
  why_chosen: string;
  key_takeaway: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  delta?: string;
  subtext?: string;
  status: 'normal' | 'success' | 'warning' | 'alert';
  icon?: string;
}

export interface FactCheckedInsight {
  id: string;
  title: string;
  statement: string;
  category: string;
  importance: string;
  is_verified: boolean;
  fact_check_verdict: string;
  math_proof: Record<string, any>;
  verification_notes: string;
  related_chart_id?: string;
  confidence_score: number;
}

export interface ColumnProfileItem {
  name: string;
  detected_type: string;
  pandas_dtype?: string;
  unique_count: number;
  null_count: number;
  null_percentage?: number;
  sample_values?: any[];
  suggested_role?: string;
}

export interface DashboardResponse {
  job_id: string;
  dataset_id: string;
  dataset_name: string;
  health_score: number;
  quality_grade: string;
  summary_cards: MetricCard[];
  charts: ChartConfig[];
  insights: FactCheckedInsight[];
  cleaning_summary: Record<string, any>;
  columns?: ColumnProfileItem[];
  quality_report?: Record<string, any>;
  created_at: string;
}

export interface DrilldownResponse {
  finding_id: string;
  deep_dive_title: string;
  investigation_summary: string;
  evidence_points: string[];
  supporting_chart?: ChartConfig;
  recommended_actions: string[];
}

export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to upload dataset');
  }

  return res.json();
}

export async function startInvestigation(datasetId: string): Promise<{ job_id: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to initiate investigation' }));
    throw new Error(err.detail || 'Failed to initiate investigation');
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status for ${jobId}`);
  }
  return res.json();
}

export async function getDashboard(jobId: string): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/dashboard/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard for job ${jobId}`);
  }
  return res.json();
}

export async function investigateFinding(jobId: string, findingId: string): Promise<DrilldownResponse> {
  const res = await fetch(`${API_BASE_URL}/drilldown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, finding_id: findingId }),
  });

  if (!res.ok) {
    throw new Error('Failed to drill down on finding');
  }

  return res.json();
}
