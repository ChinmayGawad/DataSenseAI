'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  GitFork,
  Download,
  Upload,
  Play,
  Search,
} from 'lucide-react';
import { DashboardResponse, FactCheckedInsight, DrilldownResponse, DatasetUploadResponse, investigateFinding } from '../../lib/api';
import InsightCardItem from '../presentation/insights/InsightCardItem';
import InsightCategoryFilter from '../presentation/insights/InsightCategoryFilter';
import AiExecutiveSummaryCard from '../presentation/insights/AiExecutiveSummaryCard';
import DrilldownModal from '../DrilldownModal';

interface InsightsViewProps {
  dashboard: DashboardResponse | null;
  uploadedDataset?: DatasetUploadResponse | null;
  onStartAnalysis?: () => void;
  onProceedToExport?: () => void;
  onNavigateToWhy?: (metric?: string) => void;
}

export default function InsightsView({
  dashboard,
  uploadedDataset,
  onStartAnalysis,
  onProceedToExport,
  onNavigateToWhy,
}: InsightsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState<string | null>(null);

  const insights: FactCheckedInsight[] = dashboard?.insights || [];
  const datasetName = dashboard?.dataset_name || uploadedDataset?.filename || 'Active Dataset';

  // Extract unique categories
  const rawCategories = Array.from(new Set(insights.map((ins) => ins.category.toLowerCase())));
  const categories = ['all', ...rawCategories];

  const filteredInsights = insights.filter((ins) => {
    const matchesCategory = activeCategory === 'all' || ins.category.toLowerCase().includes(activeCategory.toLowerCase());
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      ins.title.toLowerCase().includes(searchLower) ||
      ins.statement.toLowerCase().includes(searchLower) ||
      ins.category.toLowerCase().includes(searchLower);
      
    return matchesCategory && matchesSearch;
  });

  const handleDrilldown = async (findingId: string) => {
    setLoadingDrilldown(findingId);
    if (!dashboard?.job_id) {
      setLoadingDrilldown(null);
      return;
    }

    try {
      const res = await investigateFinding(dashboard.job_id, findingId);
      setDrilldownData(res);
    } catch (err) {
      console.error('Failed to load drilldown:', err);
    } finally {
      setLoadingDrilldown(null);
    }
  };

  // State 1: No dataset uploaded at all
  if (!dashboard && !uploadedDataset) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <Upload className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Dataset Uploaded</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Upload a spreadsheet or document to automatically synthesize mathematically verified business insights.
          </p>
        </div>
      </div>
    );
  }

  // State 2: Dataset uploaded, but investigation not yet run
  if (!dashboard && uploadedDataset) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Insights Pending for {uploadedDataset.filename}
            </h2>
            <p className="text-sm text-slate-500 max-w-md">
              The 8-agent pipeline will audit statistical correlations, anomaly distributions, and cluster segmentations to formulate verified insights.
            </p>
          </div>
          {onStartAnalysis && (
            <button
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Launch Multi-Agent Investigation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // State 3: Fully analyzed insights
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Mathematically Verified Insights
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Key Insights • {datasetName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Every analytical claim is audited against deterministic ground truth calculations before presentation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToWhy && (
            <button
              onClick={() => onNavigateToWhy()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13332a] hover:bg-[#194237] text-white text-xs font-bold border border-emerald-500/30 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <GitFork className="w-4 h-4 text-emerald-400" />
              <span>Investigate in Why? Engine</span>
            </button>
          )}

          {onProceedToExport && (
            <button
              onClick={onProceedToExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Presentation Module 1: AI Executive Summary */}
      <AiExecutiveSummaryCard
        insights={insights}
        datasetName={datasetName}
        totalObservations={dashboard?.summary_cards?.find(c => c.id === 'card_records')?.value}
      />

      {/* Presentation Module 2: Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <InsightCategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 text-slate-800 shadow-sm"
          />
        </div>
      </div>

      {/* Presentation Module 3: Insights Cards Grid */}
      {filteredInsights.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">No insights in this category</p>
          <p className="text-xs text-slate-500">Select "All Findings" to view all verified insights from this dataset.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <InsightCardItem
              key={insight.id}
              insight={insight}
              isExpanded={expandedInsightId === insight.id}
              onToggleExpand={() => setExpandedInsightId(expandedInsightId === insight.id ? null : insight.id)}
              onDrilldown={() => handleDrilldown(insight.id)}
              loadingDrilldown={loadingDrilldown === insight.id}
            />
          ))}
        </div>
      )}

      {/* Deep-Dive Drilldown Modal */}
      {drilldownData && (
        <DrilldownModal
          drilldown={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}
    </div>
  );
}
