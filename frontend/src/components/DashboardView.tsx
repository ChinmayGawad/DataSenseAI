'use client';

import React, { useState } from 'react';
import {
  HeartPulse,
  Database,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';
import { DashboardResponse, FactCheckedInsight, ChartConfig, DrilldownResponse, investigateFinding } from '../lib/api';
import PlotlyChart from './PlotlyChart';
import DrilldownModal from './DrilldownModal';

interface DashboardViewProps {
  dashboard: DashboardResponse;
  onNewInvestigation: () => void;
}

export default function DashboardView({ dashboard, onNewInvestigation }: DashboardViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState<string | null>(null);

  const handleDrilldown = async (findingId: string) => {
    setLoadingDrilldown(findingId);
    try {
      const res = await investigateFinding(dashboard.job_id, findingId);
      setDrilldownData(res);
    } catch (err) {
      console.error('Error during drilldown:', err);
    } finally {
      setLoadingDrilldown(null);
    }
  };

  const filteredInsights = activeCategory === 'all'
    ? dashboard.insights
    : dashboard.insights.filter((ins) => ins.category === activeCategory);

  const getCardIcon = (iconName?: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'Database': return <Database className="w-5 h-5 text-blue-400" />;
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'Users': return <Users className="w-5 h-5 text-indigo-400" />;
      default: return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Autonomous Investigation Complete
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Self-Designing Dashboard: {dashboard.dataset_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Synthesized by 8 specialized AI agents with 100% mathematical verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Data Health Score</span>
              <span className="text-xl font-bold text-emerald-400">{dashboard.health_score}%</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {dashboard.quality_grade}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.summary_cards.map((card) => (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                {getCardIcon(card.icon)}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              {card.delta && (
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {card.delta}
                </span>
              )}
            </div>
            {card.subtext && (
              <p className="text-xs text-slate-500 mt-1 truncate">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>

      {/* Fact-Checked Insights Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fact-Checked Investigative Insights</h2>
              <p className="text-xs text-slate-400">
                Generated by Insight Analyst and audited against Python ground-truth math.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {['all', 'anomaly', 'correlation', 'distribution', 'quality'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {insight.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Fact-Checked
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{insight.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{insight.statement}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedProofId(selectedProofId === insight.id ? null : insight.id)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {selectedProofId === insight.id ? 'Hide Math Proof' : 'View Math Proof'}
                </button>

                <button
                  onClick={() => handleDrilldown(insight.id)}
                  disabled={loadingDrilldown === insight.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-blue-600/80 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Search className="w-3 h-3" />
                  {loadingDrilldown === insight.id ? 'Investigating...' : 'Investigate This Finding'}
                </button>
              </div>

              {/* Collapsible Math Proof Details */}
              {selectedProofId === insight.id && (
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-slate-800 text-xs">
                  <p className="text-[11px] text-slate-400 mb-1 font-medium">Fact-Checker Audit Log:</p>
                  <p className="text-[11px] text-slate-300 mb-2 italic">&ldquo;{insight.verification_notes}&rdquo;</p>
                  <pre className="p-2 rounded bg-slate-900/90 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                    {JSON.stringify(insight.math_proof, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Self-Designing Visualizations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Self-Designing Visualizations</h2>
            <p className="text-xs text-slate-400">
              Charts autonomously configured and selected by Visualization Architect based on statistical distributions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboard.charts.map((chart) => (
            <div
              key={chart.id}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{chart.title}</h3>
                    <span className="text-[11px] text-slate-400 font-mono uppercase">
                      Type: {chart.chart_type}
                    </span>
                  </div>

                  {/* "Why did AI choose this chart?" Transparency Trigger */}
                  <button
                    onClick={() => setExpandedWhyId(expandedWhyId === chart.id ? null : chart.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg transition-colors font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Why this chart?
                  </button>
                </div>

                {/* Transparency Dropdown */}
                {expandedWhyId === chart.id && (
                  <div className="mb-4 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
                    <p className="font-semibold text-indigo-300 mb-1">Architect Rationale:</p>
                    <p className="text-xs leading-relaxed">{chart.why_chosen}</p>
                  </div>
                )}

                {/* Chart Rendering */}
                <PlotlyChart
                  data={chart.plotly_data}
                  layout={chart.plotly_layout}
                  className="h-[320px] w-full"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300 truncate">
                  Key Takeaway: {chart.key_takeaway}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cleaning Log Audit Drawer */}
      {dashboard.cleaning_summary && (
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Autonomous Cleaning Audit Log (Agent 3)
            </span>
            <span className="text-slate-500 text-[11px]">
              {dashboard.cleaning_summary.total_actions_count || 0} operations applied
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Deduplication</span>
              <span className="text-sm font-bold text-white">
                {dashboard.cleaning_summary.duplicates_removed || 0} rows removed
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Imputations</span>
              <span className="text-sm font-bold text-white">
                {(dashboard.cleaning_summary.imputation_actions || []).length} features imputed
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Dropped Columns</span>
              <span className="text-sm font-bold text-white">
                {(dashboard.cleaning_summary.columns_dropped || []).length} dropped (&gt;70% null)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Deep Dive Modal */}
      <DrilldownModal
        drilldown={drilldownData}
        onClose={() => setDrilldownData(null)}
      />
    </div>
  );
}
