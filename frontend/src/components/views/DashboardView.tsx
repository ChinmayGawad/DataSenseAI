'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
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
    value: '$128,430',
    delta: '+12.4%',
    isPositive: true,
    subtext: 'vs last month',
  },
  {
    id: 'kpi_profit',
    label: 'Total Profit',
    value: '$34,210',
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

const DEFAULT_LINE_CHART: ChartConfig = {
  id: 'chart_sales_trend',
  title: 'Sales Trend Over Time',
  chart_type: 'line',
  x_axis: 'Month',
  y_axis: 'Sales ($)',
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
  why_chosen: 'Line chart with spline smoothing is the optimal visual encoding for continuous chronological trends and trajectory identification.',
  key_takeaway: 'Sales demonstrate consistent 22% quarter-over-quarter compounding growth.',
};

const DEFAULT_DONUT_CHART: ChartConfig = {
  id: 'chart_product_distribution',
  title: 'Product Distribution',
  chart_type: 'donut',
  x_axis: 'Category',
  plotly_data: [
    {
      labels: ['Technology', 'Furniture', 'Office Supplies'],
      values: [48, 32, 20],
      type: 'pie',
      hole: 0.65,
      marker: {
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      },
      textinfo: 'percent',
      hoverinfo: 'label+percent',
    },
  ],
  plotly_layout: {
    margin: { t: 20, r: 20, b: 20, l: 20 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.2, x: 0.1 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  },
  why_chosen: 'Donut chart is ideal for displaying part-to-whole proportions when categories are few (<= 4), maximizing whitespace legibility.',
  key_takeaway: 'Technology represents nearly half (48%) of all sales volume.',
};

const DEFAULT_BAR_CHART: ChartConfig = {
  id: 'chart_sales_by_region',
  title: 'Sales by Region',
  chart_type: 'bar',
  x_axis: 'Region',
  y_axis: 'Sales ($)',
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
  why_chosen: 'Vertical bar chart provides the highest cognitive accuracy for discrete category comparisons along a quantitative axis.',
  key_takeaway: 'The West region is the primary revenue driver, exceeding South by 141%.',
};

export default function DashboardView({ dashboard, onNavigateToInsights }: DashboardViewProps) {
  const [timeHorizon, setTimeHorizon] = useState('Last 30 Days');
  const [activeWhyChart, setActiveWhyChart] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);

  const charts = dashboard?.charts && dashboard.charts.length > 0 ? dashboard.charts : [];
  const lineChart = charts.find((c) => c.chart_type === 'line' || c.chart_type === 'scatter') || DEFAULT_LINE_CHART;
  const donutChart = charts.find((c) => c.chart_type === 'donut' || c.chart_type === 'pie') || DEFAULT_DONUT_CHART;
  const barChart = charts.find((c) => c.chart_type === 'bar' || c.chart_type === 'histogram') || DEFAULT_BAR_CHART;

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

      {/* Presentation Module 2: Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chart 1: Sales Trend (Span 8) */}
        <div className="lg:col-span-8">
          <ChartCard
            chart={lineChart}
            subtitle="Continuous temporal progression"
            isWhyOpen={activeWhyChart === lineChart.id}
            onToggleWhy={() =>
              setActiveWhyChart(activeWhyChart === lineChart.id ? null : lineChart.id)
            }
            height={280}
          />
        </div>

        {/* Chart 2: Product Distribution Donut (Span 4) */}
        <div className="lg:col-span-4">
          <ChartCard
            chart={donutChart}
            subtitle="Part-to-whole categorical share"
            isWhyOpen={activeWhyChart === donutChart.id}
            onToggleWhy={() =>
              setActiveWhyChart(activeWhyChart === donutChart.id ? null : donutChart.id)
            }
            height={280}
          />
        </div>

        {/* Chart 3: Sales by Region Bar Chart (Span 12) */}
        <div className="lg:col-span-12">
          <ChartCard
            chart={barChart}
            subtitle="Discrete comparative benchmark"
            isWhyOpen={activeWhyChart === barChart.id}
            onToggleWhy={() =>
              setActiveWhyChart(activeWhyChart === barChart.id ? null : barChart.id)
            }
            height={260}
          />
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
