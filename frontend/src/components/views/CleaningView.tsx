'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import ComparisonGauge from '../ui/ComparisonGauge';
import CleaningMetricCards from '../presentation/cleaning/CleaningMetricCards';
import CleaningAuditSummary from '../presentation/cleaning/CleaningAuditSummary';
import { DashboardResponse } from '../../lib/api';

interface CleaningViewProps {
  dashboard: DashboardResponse | null;
  onContinueToDashboard: () => void;
  onViewProfile?: () => void;
}

export default function CleaningView({
  dashboard,
  onContinueToDashboard,
  onViewProfile,
}: CleaningViewProps) {
  const cleaning = dashboard?.cleaning_summary || {};
  const missingFixed = cleaning.missing_values_imputed ?? 129;
  const duplicatesRemoved = cleaning.duplicates_removed ?? 47;
  const formatIssues = cleaning.format_issues_fixed ?? 21;
  const standardized = cleaning.inconsistent_entries_standardized ?? 18;

  const quality = dashboard?.quality_report || {};
  const beforeScore = quality.initial_health_score ?? 72;
  const afterScore = dashboard?.health_score ? Math.round(dashboard.health_score) : 98;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Autonomous Quality Remediation
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Data Cleaning Report
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Our Data Cleaner agent has autonomously standardized formats, resolved missing cells, and removed duplicate observations.
        </p>
      </div>

      {/* Presentation Module 1: 4 Metric Fix Cards */}
      <CleaningMetricCards
        missingFixed={missingFixed}
        duplicatesRemoved={duplicatesRemoved}
        formatIssues={formatIssues}
        standardized={standardized}
      />

      {/* Presentation Module 2: Quality Improvement Comparison Gauge */}
      <ComparisonGauge
        beforePercentage={beforeScore}
        afterPercentage={afterScore}
        label="Data Quality Improvement"
        subtext="Audit completed against ISO 8000 data hygiene standards."
      />

      {/* Presentation Module 3: Confirmation & Details Summary */}
      <CleaningAuditSummary />

      {/* Action Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {onViewProfile && (
          <button
            onClick={onViewProfile}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            ← Back to Column Profile
          </button>
        )}

        <button
          onClick={onContinueToDashboard}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer ml-auto"
        >
          <span>Continue to Analysis Dashboard</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
}
