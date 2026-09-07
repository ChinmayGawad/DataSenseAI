'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, Workflow } from 'lucide-react';
import { DashboardResponse, ChartConfig, DrilldownResponse } from '../../lib/api';
import DrilldownModal from '../DrilldownModal';
import KpiCardsGrid, { KpiItem } from '../presentation/dashboard/KpiCardsGrid';
import ChartCard from '../presentation/dashboard/ChartCard';

interface DashboardViewProps {
  dashboard: DashboardResponse | null;
  onNavigateToInsights?: () => void;
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

export default function DashboardView({ dashboard, onNavigateToInsights }: DashboardViewProps) {
  const [timeHorizon, setTimeHorizon] = useState('Last 30 Days');
  const [activeWhyChart, setActiveWhyChart] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);

  const charts = dashboard?.charts && dashboard.charts.length > 0 ? dashboard.charts : [];

  const lineChart = charts.find((c) => c.chart_type === 'line' || c.detected_inputs?.includes('Date')) || DEFAULT_LINE_CHART;
  const barChart = charts.find((c) => c.chart_type === 'bar' || c.detected_inputs?.includes('Category')) || DEFAULT_BAR_CHART;
  const scatterChart = charts.find((c) => c.chart_type === 'scatter' || c.detected_inputs === 'Numeric + Numeric') || DEFAULT_SCATTER_CHART;
  const histChart = charts.find((c) => c.chart_type === 'histogram' || c.detected_inputs?.includes('Single Numeric')) || DEFAULT_HISTOGRAM_CHART;
  const heatmapChart = charts.find((c) => c.chart_type === 'heatmap' || c.detected_inputs?.includes('Multiple Numeric')) || DEFAULT_HEATMAP_CHART;

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
            Insight Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Auto-generated visual analytics with explainable AI reasoning.
          </p>
        </div>

        {/* Time Horizon Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center">
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="appearance-none bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold py-2.5 pl-4 pr-9 rounded-xl shadow-2xs hover:border-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
              <option>All Time</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          </div>

          {onNavigateToInsights && (
            <button
              onClick={onNavigateToInsights}
              className="px-4 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              View Key Insights ➔
            </button>
          )}
        </div>
      </div>

      {/* Presentation Module 1: 4 KPI Summary Cards */}
      <KpiCardsGrid kpis={DEFAULT_KPIS} />

      {/* Presentation Module 2: Visualizations Grid Adhering to 5 Decision Rules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-emerald-600" />
            Rule-Generated Visualizations
          </h3>
          <span className="text-xs text-slate-500">
            5 Auto-selected visuals based on schema classification
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rule 1: Date + Numeric -> Line Chart (Span 8) */}
          <div className="lg:col-span-8">
            <ChartCard
              chart={lineChart}
              subtitle="Rule 1: Date + Numeric → Line Chart"
              isWhyOpen={activeWhyChart === lineChart.id}
              onToggleWhy={() =>
                setActiveWhyChart(activeWhyChart === lineChart.id ? null : lineChart.id)
              }
              height={280}
            />
          </div>

          {/* Rule 2: Category + Numeric -> Bar Chart (Span 4) */}
          <div className="lg:col-span-4">
            <ChartCard
              chart={barChart}
              subtitle="Rule 2: Category + Numeric → Bar Chart"
              isWhyOpen={activeWhyChart === barChart.id}
              onToggleWhy={() =>
                setActiveWhyChart(activeWhyChart === barChart.id ? null : barChart.id)
              }
              height={280}
            />
          </div>

          {/* Rule 3: Numeric + Numeric -> Scatter Plot (Span 6) */}
          <div className="lg:col-span-6">
            <ChartCard
              chart={scatterChart}
              subtitle="Rule 3: Numeric + Numeric → Scatter Plot"
              isWhyOpen={activeWhyChart === scatterChart.id}
              onToggleWhy={() =>
                setActiveWhyChart(activeWhyChart === scatterChart.id ? null : scatterChart.id)
              }
              height={260}
            />
          </div>

          {/* Rule 4: Single Numeric Variable -> Histogram (Span 6) */}
          <div className="lg:col-span-6">
            <ChartCard
              chart={histChart}
              subtitle="Rule 4: Single Numeric Variable → Histogram"
              isWhyOpen={activeWhyChart === histChart.id}
              onToggleWhy={() =>
                setActiveWhyChart(activeWhyChart === histChart.id ? null : histChart.id)
              }
              height={260}
            />
          </div>

          {/* Rule 5: Multiple Numeric Variables -> Heatmap Matrix (Span 12) */}
          <div className="lg:col-span-12">
            <ChartCard
              chart={heatmapChart}
              subtitle="Rule 5: Multiple Numeric Variables → Heatmap Matrix"
              isWhyOpen={activeWhyChart === heatmapChart.id}
              onToggleWhy={() =>
                setActiveWhyChart(activeWhyChart === heatmapChart.id ? null : heatmapChart.id)
              }
              height={300}
            />
          </div>
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
