'use client';

import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import ComparisonGauge from '../ui/ComparisonGauge';
import CleaningMetricCards from '../presentation/cleaning/CleaningMetricCards';
import CleaningAuditSummary from '../presentation/cleaning/CleaningAuditSummary';
import RawDataPreviewModal from '../presentation/profile/RawDataPreviewModal';
import { DashboardResponse, DatasetUploadResponse } from '../../lib/api';

interface CleaningViewProps {
  dashboard: DashboardResponse | null;
  uploadedDataset?: DatasetUploadResponse | null;
  onContinueToDashboard: () => void;
  onViewProfile?: () => void;
}

export default function CleaningView({
  dashboard,
  uploadedDataset,
  onContinueToDashboard,
  onViewProfile,
}: CleaningViewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const cleaning = dashboard?.cleaning_summary || {};
  const missingFixed = cleaning.missing_values_imputed ?? 0;
  const duplicatesRemoved = cleaning.duplicates_removed ?? 0;
  const formatIssues = cleaning.format_issues_fixed ?? 0;
  const standardized = cleaning.inconsistent_entries_standardized ?? 0;

  const quality = dashboard?.quality_report || {};
  const uploadHealth = uploadedDataset?.health?.health_score;
  const beforeScore = quality.initial_health_score ?? (uploadHealth ? Math.round(uploadHealth) : 88);
  const afterScore = dashboard?.health_score ? Math.round(dashboard.health_score) : (uploadHealth ? Math.round(uploadHealth) : 100);

  const datasetName = dashboard?.dataset_name || uploadedDataset?.filename || 'Active Dataset';
  const hasDataset = !!dashboard || !!uploadedDataset;
  const isCleaned = !!dashboard;

  if (!hasDataset) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <Upload className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Dataset Uploaded</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Upload a spreadsheet or document to view autonomous quality remediation and data cleaning metrics.
          </p>
        </div>
      </div>
    );
  }

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
          {isCleaned
            ? `Autonomous remediation completed for ${datasetName}. Zero manual intervention required.`
            : `Initial hygiene audit ready for ${datasetName}. Launch analysis to execute automatic remediation.`}
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
        message={
          isCleaned
            ? "Data cleaning completed! Your dataset is now clean and ready for analysis."
            : "Dataset scanned. Full multi-agent remediation runs during investigation."
        }
      />

      {/* Presentation Module 3: Confirmation & Details Summary */}
      <CleaningAuditSummary />

      {/* Action Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              ← Back to Overview
            </button>
          )}

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Preview Cleaned Data
          </button>
        </div>

        <button
          onClick={onContinueToDashboard}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer sm:ml-auto"
        >
          <span>Continue to Analysis Dashboard</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Preview Cleaned Data Modal */}
      <RawDataPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        datasetName={datasetName}
        rawRows={(dashboard as any)?.raw_rows || uploadedDataset?.sample_rows}
      />
    </div>
  );
}
