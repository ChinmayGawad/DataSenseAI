'use client';

import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Sparkles,
  Layers,
  Activity,
  Calculator,
  RefreshCw,
  Sliders,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  GitCompare,
  CheckCircle2,
} from 'lucide-react';
import {
  WhyInvestigationResponse,
  EvidencePackageData,
  getWhyInvestigation,
  runWhyInvestigation,
} from '../../lib/api';

import RootCauseTree from '../presentation/why/RootCauseTree';
import ShowEvidenceModal from '../presentation/why/ShowEvidenceModal';
import WhatIfSimulator from '../presentation/why/WhatIfSimulator';
import CompetingHypotheses from '../presentation/why/CompetingHypotheses';
import InvestigationTimeline from '../presentation/why/InvestigationTimeline';
import WhyDidWeStopCard from '../presentation/why/WhyDidWeStopCard';
import DatasetComparisonModal from '../presentation/why/DatasetComparisonModal';

interface WhyEngineViewProps {
  jobId: string;
  initialTargetMetric?: string;
  onNavigateToDashboard?: () => void;
}

export default function WhyEngineView({
  jobId,
  initialTargetMetric,
  onNavigateToDashboard,
}: WhyEngineViewProps) {
  const [whyData, setWhyData] = useState<WhyInvestigationResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>(initialTargetMetric || '');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidencePackageData | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Why? Engine investigation
  const fetchInvestigation = async (metric?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWhyInvestigation(jobId, metric || undefined);
      setWhyData(data);
      if (!selectedMetric && data.target_metric) {
        setSelectedMetric(data.target_metric);
      }
    } catch (err: any) {
      console.error('Failed to load Why? Engine investigation:', err);
      setError(err.message || 'Failed to execute root-cause investigation.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigation(initialTargetMetric);
  }, [jobId, initialTargetMetric]);

  const handleMetricChange = (newMetric: string) => {
    setSelectedMetric(newMetric);
    fetchInvestigation(newMetric);
  };

  const handleOpenEvidence = (evidence: EvidencePackageData) => {
    setSelectedEvidence(evidence);
    setIsEvidenceModalOpen(true);
  };

  if (isLoading && !whyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-bold text-slate-800 text-base">
            Autonomous Why? Engine Investigating...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Scanning dimensions, computing segment contributions, testing statistical significance, and checking seasonality.
          </p>
        </div>
      </div>
    );
  }

  if (error && !whyData) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-base">Investigation Error</h3>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
        <button
          onClick={() => fetchInvestigation(selectedMetric)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Retry Investigation
        </button>
      </div>
    );
  }

  if (!whyData) return null;

  const targetSummary = whyData.target_summary || {};
  const isDecline = (targetSummary.delta_pct || 0) < 0;
  const primaryChild = whyData.root_cause_tree?.children?.[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* View Header & Metric Selector Bar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white pb-6 border-b border-slate-200">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold">
              Root-Cause AI Active
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-none">
            Why Engine
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed pt-2">
            Autonomous multi-level investigation, mathematical contribution quantification, and counterfactual simulation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Target Metric Selector */}
          {whyData.available_metrics && whyData.available_metrics.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 pl-3">Target Metric</span>
              <select
                value={selectedMetric || whyData.target_metric}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="bg-white text-xs font-semibold text-slate-900 rounded-md px-3 py-1.5 border-none shadow-xs focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {whyData.available_metrics.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs cursor-pointer transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-400" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => fetchInvestigation(selectedMetric)}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Re-run Autonomous Investigation"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Shift Executive Banner (Linear-Style Minimalist Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Narrative */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-2xl md:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
            {whyData.executive_headline || `Why Did ${whyData.target_metric} ${isDecline ? 'Decline' : 'Shift'}?`}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-[65ch]">
            {whyData.narrative_summary}
          </p>
          
          {/* Domain & Guardrail Row */}
          <div className="pt-4 flex items-center gap-4 flex-wrap text-xs text-slate-500 border-t border-slate-100">
            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
              {whyData.dataset_fingerprint?.detected_domain || 'General Business'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {whyData.seasonality_report?.seasonality_detected ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Recurring Pattern
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Isolated Shift
                </span>
              )}
            </span>
            <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
              Confounder Risk: <strong className="text-slate-700">{whyData.confounding_audit?.confounding_risk || 'Low'}</strong>
            </span>
          </div>
        </div>

        {/* Right KPIs (Bento Grid Style) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Baseline</span>
            <p className="text-2xl font-semibold text-slate-900">
              {targetSummary.baseline_value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Current</span>
            <p className="text-2xl font-semibold text-slate-900">
              {targetSummary.current_value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`p-5 rounded-2xl border space-y-2 ${
            isDecline ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDecline ? 'text-rose-600' : 'text-emerald-700'}`}>Total Delta</span>
            <p className={`text-3xl font-bold tracking-tight ${isDecline ? 'text-rose-700' : 'text-emerald-800'}`}>
              {targetSummary.delta_pct >= 0 ? '+' : ''}{targetSummary.delta_pct?.toFixed(1)}%
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Confidence</span>
            <p className="text-3xl font-bold tracking-tight text-white">
              {whyData.evidence_score?.toFixed(0)}<span className="text-lg text-slate-500">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Root-Cause Tree & Counterfactual Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Top: Interactive Root Cause Tree */}
        <div className="lg:col-span-12 space-y-8">
          {whyData.root_cause_tree && (
            <RootCauseTree
              rootNode={whyData.root_cause_tree}
              onSelectEvidence={handleOpenEvidence}
            />
          )}

          {/* Counterfactual What-If Simulator */}
          <WhatIfSimulator
            jobId={jobId}
            targetMetric={whyData.target_metric}
            initialCounterfactual={whyData.counterfactual_summary}
            driverDimension={primaryChild?.dimension || 'Primary Dimension'}
            driverSegment={primaryChild?.segment || 'Primary Driver'}
            baselineValue={primaryChild?.baseline_value || targetSummary.baseline_value}
            currentValue={primaryChild?.current_value || targetSummary.current_value}
            observedTotal={targetSummary.current_value}
          />
        </div>
      </div>

      {/* Secondary Insights & Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competing Explanations */}
        <CompetingHypotheses
          hypotheses={whyData.competing_hypotheses}
          seasonalityDetected={whyData.seasonality_report?.seasonality_detected}
        />

        {/* Actionable Recommendations */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Recommended Investigations &amp; Actions
            </h3>
          </div>

          <div className="space-y-3">
            {whyData.recommendations && whyData.recommendations.length > 0 ? (
              whyData.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">{rec.finding}</p>
                      <p className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Suggested Action: </span>
                        {rec.possible_action || rec.suggested_investigation}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No immediate corrective actions required.</p>
            )}
          </div>
        </div>
      </div>

      {/* Explainability & Investigation Trail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Why Did We Stop? Card */}
        {whyData.root_cause_tree && (
          <WhyDidWeStopCard rootNode={whyData.root_cause_tree} />
        )}

        {/* Autonomous Investigation Timeline */}
        <InvestigationTimeline
          steps={(whyData.timeline_steps || []) as any}
          evidenceScore={whyData.evidence_score}
          durationMs={whyData.duration_ms}
        />
      </div>

      {/* Show Evidence Modal */}
      <ShowEvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        evidence={selectedEvidence}
      />

      {/* Dataset Comparison Modal */}
      <DatasetComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        currentJobId={jobId}
      />
    </div>
  );
}
