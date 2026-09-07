'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, Workflow, GitFork, ArrowRight, Layers } from 'lucide-react';
import { DashboardResponse, ChartConfig, DrilldownResponse } from '../../lib/api';
import DrilldownModal from '../DrilldownModal';
import KpiCardsGrid, { KpiItem } from '../presentation/dashboard/KpiCardsGrid';
import ChartCard from '../presentation/dashboard/ChartCard';

interface DashboardViewProps {
  dashboard: DashboardResponse | null;
  onNavigateToInsights?: () => void;
  onNavigateToWhy?: (metric?: string) => void;
}

const DEFAULT_KPIS: KpiItem[] = [
  {
    id: 'kpi_sales',
    label: 'Total Sales',
    value: '₹1,28,430',
    delta: '+12.4%',
    isPositive: true,
    subtext: 'vs last month',
  },
  {
    id: 'kpi_profit',
    label: 'Total Profit',
    value: '₹34,210',
    delta: '+8.2%',
    isPositive: true,
    subtext: 'vs last month',
  },
  {
    id: 'kpi_orders',
    label: 'Total Orders',
    value: '1,420',
    delta: '-2.1%',
    isPositive: false,
    subtext: 'vs last month',
  },
  {
    id: 'kpi_customers',
    label: 'Total Customers',
    value: '892',
    delta: '+5.3%',
    isPositive: true,
    subtext: 'vs last month',
  },
];

// 1. RULE: Date + Numeric -> Line Chart
const DEFAULT_LINE_CHART: ChartConfig = {
  id: 'chart_sales_trend',
  title: 'Sales Trend Over Time',
  chart_type: 'line',
  x_axis: 'Month',
  y_axis: 'Sales (₹)',
  detected_inputs: 'Date + Numeric',
  decision_rule: 'Date + Numeric → Line Chart',
  plotly_data: [
    {
      x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      y: [7200, 8100, 9400, 8900, 11200, 10800, 12500, 13100, 12900, 14200, 15800, 17200],
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#10b981', width: 3, shape: 'spline' },
      marker: { color: '#047857', size: 6 },
      fill: 'tozeroy',
      fillcolor: 'rgba(16, 185, 129, 0.08)',
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 40, l: 50 },
    xaxis: { gridcolor: '#f1f5f9' },
    yaxis: { gridcolor: '#f1f5f9' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  },
  why_chosen: 'Auto-selected Line Chart: Chronological inputs (Month + Sales) are best represented linearly to expose temporal velocity, seasonality, and time-series compounding growth.',
  key_takeaway: 'Sales demonstrate consistent 22% quarter-over-quarter compounding growth.',
};

// 2. RULE: Category + Numeric -> Bar Chart
const DEFAULT_BAR_CHART: ChartConfig = {
  id: 'chart_sales_by_region',
  title: 'Sales by Region Breakdown',
  chart_type: 'bar',
  x_axis: 'Region',
  y_axis: 'Sales (₹)',
  detected_inputs: 'Category + Numeric',
  decision_rule: 'Category + Numeric → Bar Chart',
  plotly_data: [
    {
      x: ['West', 'East', 'Central', 'South'],
      y: [45200, 38100, 26400, 18730],
      type: 'bar',
      marker: {
        color: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
        borderRadius: 8,
      },
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 40, l: 50 },
    xaxis: { gridcolor: '#f1f5f9' },
    yaxis: { gridcolor: '#f1f5f9' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  },
  why_chosen: 'Auto-selected Bar Chart: Categorical grouping (Region) against quantitative revenue provides the clearest ranking and Pareto distribution comparison.',
  key_takeaway: 'The West region is the primary revenue driver (₹45,200), exceeding South by 141%.',
};

// 3. RULE: Numeric + Numeric -> Scatter Plot
const DEFAULT_SCATTER_CHART: ChartConfig = {
  id: 'chart_sales_vs_profit',
  title: 'Sales vs. Profit Correlation',
  chart_type: 'scatter',
  x_axis: 'Sales (₹)',
  y_axis: 'Profit (₹)',
  detected_inputs: 'Numeric + Numeric',
  decision_rule: 'Numeric + Numeric → Scatter Plot',
  plotly_data: [
    {
      x: [250, 480, 750, 1100, 1450, 1800, 2200, 2600, 3100, 3700, 4200, 4900, 5400, 6100],
      y: [45, 95, 160, 240, 310, 410, 490, 580, 710, 820, 930, 1080, 1190, 1340],
      mode: 'markers',
      type: 'scatter',
      marker: { size: 8, color: '#059669', opacity: 0.8 },
      name: 'Transactions',
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 40, l: 50 },
    xaxis: { gridcolor: '#f1f5f9', title: 'Sales (₹)' },
    yaxis: { gridcolor: '#f1f5f9', title: 'Profit (₹)' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  },
  why_chosen: 'Auto-selected Scatter Plot: Two continuous numeric variables (Sales and Profit) mapped on Cartesian axes to expose linear correlation (r=0.91) and margin dispersion.',
  key_takeaway: 'Profit exhibits strong positive elasticity relative to sales volume (r=0.91).',
};

// 4. RULE: Single Numeric Variable -> Histogram
const DEFAULT_HISTOGRAM_CHART: ChartConfig = {
  id: 'chart_sales_dist',
  title: 'Sales Frequency Distribution',
  chart_type: 'histogram',
  x_axis: 'Sales Amount (₹)',
  y_axis: 'Frequency',
  detected_inputs: 'Single Numeric Variable',
  decision_rule: 'Single Numeric Variable → Histogram',
  plotly_data: [
    {
      x: [120, 240, 290, 310, 450, 480, 520, 590, 640, 710, 780, 890, 920, 1100, 1250, 1400, 1600, 1800, 2100, 2400, 2900, 3400, 4100, 4800, 5200],
      type: 'histogram',
      nbinsx: 12,
      marker: { color: '#10b981', line: { color: '#047857', width: 1 } },
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 40, l: 50 },
    xaxis: { gridcolor: '#f1f5f9', title: 'Transaction Value (₹)' },
    yaxis: { gridcolor: '#f1f5f9', title: 'Order Count' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    bargap: 0.05,
  },
  why_chosen: 'Auto-selected Histogram: Single numeric variable is partitioned into discrete bins to model density distribution, skewness, and transaction volume clusters.',
  key_takeaway: '72% of transactions cluster below ₹1,500 with a long-tail distribution reaching ₹5,200.',
};

// 5. RULE: Multiple Numeric Variables -> Heatmap Matrix
const DEFAULT_HEATMAP_CHART: ChartConfig = {
  id: 'chart_multivariate_matrix',
  title: 'Multivariate Feature Correlation Matrix',
  chart_type: 'heatmap',
  x_axis: 'Attributes',
  y_axis: 'Attributes',
  detected_inputs: 'Multiple Numeric Variables',
  decision_rule: 'Multiple Numeric Variables → Heatmap Matrix',
  plotly_data: [
    {
      z: [
        [1.0, 0.89, 0.42, -0.15],
        [0.89, 1.0, 0.38, -0.22],
        [0.42, 0.38, 1.0, 0.05],
        [-0.15, -0.22, 0.05, 1.0],
      ],
      x: ['Sales (₹)', 'Profit (₹)', 'Quantity', 'Discount'],
      y: ['Sales (₹)', 'Profit (₹)', 'Quantity', 'Discount'],
      type: 'heatmap',
      colorscale: 'Viridis',
      zmin: -1.0,
      zmax: 1.0,
      colorbar: { thickness: 10, len: 0.8 },
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 60, l: 80 },
    xaxis: { tickangle: -25 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  },
  why_chosen: 'Auto-selected Heatmap Matrix: Multiple numeric variables (Sales, Profit, Quantity, Discount) are compressed into a symmetric correlation matrix to expose collinearities.',
  key_takeaway: 'Sales and Profit exhibit high co-movement (+0.89), while higher Discounts negatively correlate with margins (-0.22).',
};

function getChartColSpan(
  chart: ChartConfig,
  index: number,
  totalCharts: number,
  displayCharts: ChartConfig[]
): string {
  const cType = (chart.chart_type || (chart as any).type || '').toLowerCase();
  const inputs = chart.detected_inputs || '';

  // Heatmap always takes full width (12 cols)
  if (cType === 'heatmap' || inputs.includes('Multiple Numeric')) {
    return 'lg:col-span-12';
  }

  // If there is only 1 chart, span full width
  if (totalCharts === 1) {
    return 'lg:col-span-12';
  }

  // If Line chart is followed by Bar chart, pair as 8 + 4
  if ((cType === 'line' || inputs.includes('Date')) && index === 0 && totalCharts > 1) {
    const nextChart = displayCharts[index + 1];
    const nextType = (nextChart?.chart_type || (nextChart as any)?.type || '').toLowerCase();
    const nextInputs = nextChart?.detected_inputs || '';
    if (nextType === 'bar' || nextInputs.includes('Category')) {
      return 'lg:col-span-8';
    }
  }
  if ((cType === 'bar' || inputs.includes('Category')) && index === 1 && totalCharts > 1) {
    const prevChart = displayCharts[index - 1];
    const prevType = (prevChart?.chart_type || (prevChart as any)?.type || '').toLowerCase();
    const prevInputs = prevChart?.detected_inputs || '';
    if (prevType === 'line' || prevInputs.includes('Date')) {
      return 'lg:col-span-4';
    }
  }

  // If the last chart in an odd list (e.g. 3rd of 3, 5th of 5), span full width 12
  if (totalCharts % 2 !== 0 && index === totalCharts - 1) {
    return 'lg:col-span-12';
  }

  // All other charts take 6 cols (half width)
  return 'lg:col-span-6';
}

export default function DashboardView({ dashboard, onNavigateToInsights, onNavigateToWhy }: DashboardViewProps) {
  const [timeHorizon, setTimeHorizon] = useState('Last 30 Days');
  const [activeWhyChart, setActiveWhyChart] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);

  const kpis: KpiItem[] = (dashboard?.summary_cards && dashboard.summary_cards.length > 0)
    ? dashboard.summary_cards.slice(0, 4).map((c, i) => ({
        id: c.id || `kpi_${i}`,
        label: c.label,
        value: c.value,
        delta: c.delta || 'Active',
        isPositive: c.status === 'alert' ? false : !c.delta?.startsWith('-'),
        subtext: c.subtext || '',
      }))
    : DEFAULT_KPIS;

  const displayCharts: ChartConfig[] = (dashboard?.charts && dashboard.charts.length > 0)
    ? dashboard.charts
    : [DEFAULT_LINE_CHART, DEFAULT_BAR_CHART, DEFAULT_SCATTER_CHART, DEFAULT_HISTOGRAM_CHART, DEFAULT_HEATMAP_CHART];

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Autonomous Visualization Engine
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Insight Dashboard{dashboard?.dataset_name ? ` • ${dashboard.dataset_name}` : ''}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {dashboard?.dataset_name
              ? `Auto-generated visual analytics for ${dashboard.dataset_name} with explainable AI reasoning.`
              : 'Auto-generated visual analytics with explainable AI reasoning.'}
          </p>
        </div>

        {/* Action Controls & Why Button */}
        <div className="flex items-center gap-3">
          {onNavigateToWhy && (
            <button
              onClick={() => onNavigateToWhy()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#13332a] hover:bg-[#194237] text-white text-xs font-bold border border-emerald-500/30 transition-all shadow-sm cursor-pointer"
            >
              <GitFork className="w-4 h-4 text-emerald-400" />
              <span>Launch Why? Engine</span>
            </button>
          )}

          {/* Time Horizon Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="appearance-none bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl shadow-2xs hover:border-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
              <option>All Time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {onNavigateToInsights && (
            <button
              onClick={onNavigateToInsights}
              className="px-4 py-2 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              View Key Insights ➔
            </button>
          )}
        </div>
      </div>

      {/* Why Engine Feature Callout Banner */}
      {onNavigateToWhy && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-[#122822] via-[#0d201b] to-slate-900 text-white border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <GitFork className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Autonomous Root-Cause Analysis Ready</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Why? Engine Active
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                Do not just see what changed. Recursively investigate why it changed, audit seasonality, and simulate counterfactuals.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToWhy()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span>Explore Root Causes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Presentation Module 1: Dynamic KPI Summary Cards */}
      <KpiCardsGrid kpis={kpis} />

      {/* Presentation Module 2: Visualizations Grid Adhering to Decision Rules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-emerald-600" />
            Rule-Generated Visualizations
          </h3>
          <span className="text-xs text-slate-500">
            {displayCharts.length} Auto-selected visual{displayCharts.length === 1 ? '' : 's'} based on schema classification
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {displayCharts.map((chart, idx) => {
            const colSpan = getChartColSpan(chart, idx, displayCharts.length, displayCharts);
            const subtitle = chart.decision_rule
              ? `Rule: ${chart.decision_rule}`
              : (chart.detected_inputs ? `Classification: ${chart.detected_inputs}` : 'Autonomous schema-driven visual');
            const isHeatmap = chart.chart_type === 'heatmap' || (chart as any).type === 'heatmap';

            return (
              <div key={chart.id || `chart_${idx}`} className={colSpan}>
                <ChartCard
                  chart={chart}
                  subtitle={subtitle}
                  isWhyOpen={activeWhyChart === chart.id}
                  onToggleWhy={() =>
                    setActiveWhyChart(activeWhyChart === chart.id ? null : chart.id)
                  }
                  height={isHeatmap ? 300 : 280}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldownData && (
        <DrilldownModal
          drilldown={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}
    </div>
  );
}
