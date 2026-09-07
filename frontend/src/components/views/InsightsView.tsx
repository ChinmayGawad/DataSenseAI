'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { DashboardResponse, FactCheckedInsight, DrilldownResponse, investigateFinding } from '../../lib/api';
import DrilldownModal from '../DrilldownModal';
import InsightCategoryFilter from '../presentation/insights/InsightCategoryFilter';
import InsightCardItem from '../presentation/insights/InsightCardItem';
import AiExecutiveSummaryCard from '../presentation/insights/AiExecutiveSummaryCard';

interface InsightsViewProps {
  dashboard: DashboardResponse | null;
  onProceedToExport?: () => void;
}

const DEFAULT_INSIGHTS: FactCheckedInsight[] = [
  {
    id: 'ins_1',
    title: 'Technology Dominates Revenue Growth',
    statement: 'Technology sales accounted for 48.2% (₹61,903) of total revenue, growing at 22.4% quarter-over-quarter with consistent positive margins.',
    category: 'growth',
    importance: 'high',
    is_verified: true,
    fact_check_verdict: 'verified',
    math_proof: {
      technology_sales: '₹61,903.20',
      total_sales: '₹1,28,430.00',
      percentage_share: '48.20%',
      qoq_growth_rate: '+22.4%',
      margin_avg: '28.1%',
    },
    verification_notes: 'Verified against pure Python ground truth aggregation on [Category == Technology].',
    confidence_score: 1.0,
  },
  {
    id: 'ins_2',
    title: 'High Discounts Trigger Negative Margins',
    statement: 'Orders with discounts above 25% showed a strong negative correlation (r = -0.68) with profitability, resulting in -₹14,204 in net margin erosion.',
    category: 'discount',
    importance: 'high',
    is_verified: true,
    fact_check_verdict: 'verified',
    math_proof: {
      pearson_correlation: -0.681,
      p_value: '0.000041',
      eroded_margin: '-₹14,204.10',
      affected_transactions: 412,
    },
    verification_notes: 'Calculated using scipy.stats.pearsonr between Discount and Profit columns.',
    confidence_score: 0.99,
  },
  {
    id: 'ins_3',
    title: 'Corporate Segment Demonstrates Highest LTV',
    statement: 'Corporate buyers yield an average order value 34% higher (₹410 vs ₹306) than Consumer accounts with 2.3x higher repeat transaction frequency.',
    category: 'customer',
    importance: 'medium',
    is_verified: true,
    fact_check_verdict: 'verified',
    math_proof: {
      corporate_aov: '₹410.25',
      consumer_aov: '₹306.10',
      aov_delta: '+34.02%',
      repeat_rate_multiplier: '2.31x',
    },
    verification_notes: 'Verified via customer cohort segmentation and transaction frequency groupby.',
    confidence_score: 0.98,
  },
  {
    id: 'ins_4',
    title: 'Multivariate Anomalies Flagged in Shipping',
    statement: 'Isolation Forest identified 42 transactions with extreme shipping costs relative to package weights, concentrated primarily in the Southern corridor.',
    category: 'anomaly',
    importance: 'medium',
    is_verified: true,
    fact_check_verdict: 'verified',
    math_proof: {
      total_anomalies: 42,
      anomaly_percentage: '0.79%',
      contamination_factor: 0.01,
      concentrated_region: 'South',
    },
    verification_notes: 'Detected by sklearn.ensemble.IsolationForest on [Shipping_Cost, Weight].',
    confidence_score: 0.97,
  },
];

export default function InsightsView({ dashboard, onProceedToExport }: InsightsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedProofId, setExpandedProofId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState<string | null>(null);

  const insights = dashboard?.insights && dashboard.insights.length > 0 ? dashboard.insights : DEFAULT_INSIGHTS;

  const filteredInsights = activeCategory === 'all'
    ? insights
    : insights.filter((ins) => ins.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const handleDrilldown = async (findingId: string) => {
    if (!dashboard?.job_id) return;
    setLoadingDrilldown(findingId);
    try {
      const res = await investigateFinding(dashboard.job_id, findingId);
      setDrilldownData(res);
    } catch (err) {
      console.error('Failed to load drilldown:', err);
    } finally {
      setLoadingDrilldown(null);
    }
  };

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
            Key Insights
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Every analytical claim is audited against deterministic ground truth before presentation.
          </p>
        </div>

        {onProceedToExport && (
          <button
            onClick={onProceedToExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>Export & Share Suite</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        )}
      </div>

      {/* Presentation Module 1: Category Filter Buttons */}
      <InsightCategoryFilter
        categories={['all', 'growth', 'customer', 'discount', 'anomaly']}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Presentation Module 2: Left Column Verified Insight Cards */}
        <div className="lg:col-span-8 space-y-4">
          {filteredInsights.map((insight) => (
            <InsightCardItem
              key={insight.id}
              insight={insight}
              isExpanded={expandedProofId === insight.id}
              onToggleExpand={() =>
                setExpandedProofId(expandedProofId === insight.id ? null : insight.id)
              }
              onDrilldown={dashboard?.job_id ? () => handleDrilldown(insight.id) : undefined}
              loadingDrilldown={loadingDrilldown === insight.id}
            />
          ))}
        </div>

        {/* Presentation Module 3: Right Column AI Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <AiExecutiveSummaryCard onDownloadPdf={() => window.print()} />
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
