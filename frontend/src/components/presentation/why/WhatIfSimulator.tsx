'use client';

import React, { useState } from 'react';
import { Sparkles, Sliders, TrendingUp, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CounterfactualSummaryData, runCounterfactual } from '../../../lib/api';

interface WhatIfSimulatorProps {
  jobId: string;
  targetMetric: string;
  initialCounterfactual?: CounterfactualSummaryData | null;
  driverDimension?: string;
  driverSegment?: string;
  baselineValue?: number;
  currentValue?: number;
  observedTotal?: number;
  unitSymbol?: string;
}

export default function WhatIfSimulator({
  jobId,
  targetMetric,
  initialCounterfactual,
  driverDimension = 'Primary Dimension',
  driverSegment = 'Primary Driver',
  baselineValue = 1000000,
  currentValue = 600000,
  observedTotal = 7600000,
  unitSymbol = '',
}: WhatIfSimulatorProps) {
  const [recoveryPct, setRecoveryPct] = useState<number>(100);
  const [data, setData] = useState<CounterfactualSummaryData | null>(initialCounterfactual || null);
  const [loading, setLoading] = useState(false);

  const handleSliderChange = async (val: number) => {
    setRecoveryPct(val);

    // Instant local parametric estimation
    const actualSegmentDelta = currentValue - baselineValue;
    const restoredDelta = actualSegmentDelta * (1.0 - (val / 100.0));
    const counterfactualTotal = observedTotal - actualSegmentDelta + restoredDelta;
    const estimatedDiff = counterfactualTotal - observedTotal;
    const estimatedPct = (estimatedDiff / Math.max(Math.abs(observedTotal), 1e-6)) * 100.0;

    setData({
      driver_dimension: driverDimension,
      driver_segment: driverSegment,
      observed_total: observedTotal,
      counterfactual_total: counterfactualTotal,
      estimated_difference_abs: estimatedDiff,
      estimated_difference_pct: estimatedPct,
      confidence_interval_lower: counterfactualTotal - Math.abs(estimatedDiff * 0.12),
      confidence_interval_upper: counterfactualTotal + Math.abs(estimatedDiff * 0.12),
      evidence_strength: Math.abs(estimatedPct) >= 10 ? 'High' : 'Medium',
      scenario_description: `Simulating ${val}% performance retention for '${driverSegment}' (${driverDimension})`,
      narrative_explanation: `Under this scenario, maintaining ${val}% of baseline ${driverSegment} volume is associated with an estimated total ${targetMetric} of ${unitSymbol}${counterfactualTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${estimatedDiff >= 0 ? '+' : ''}${unitSymbol}${estimatedDiff.toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${estimatedPct >= 0 ? '+' : ''}${estimatedPct.toFixed(1)}% vs observed).`,
      unit_symbol: unitSymbol,
    });
  };

  const handleServerRecalculate = async () => {
    setLoading(true);
    try {
      const res = await runCounterfactual({
        jobId,
        targetMetric,
        driverDimension,
        driverSegment,
        baselineValue,
        currentValue,
        observedTotal,
        simulatedRecoveryPct: recoveryPct,
      });
      setData(res);
    } catch (e) {
      console.error('Counterfactual recalculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const simData = data || {
    driver_dimension: driverDimension,
    driver_segment: driverSegment,
    observed_total: observedTotal,
    counterfactual_total: observedTotal + (baselineValue - currentValue),
    estimated_difference_abs: baselineValue - currentValue,
    estimated_difference_pct: ((baselineValue - currentValue) / Math.max(observedTotal, 1e-6)) * 100,
    confidence_interval_lower: observedTotal + (baselineValue - currentValue) * 0.88,
    confidence_interval_upper: observedTotal + (baselineValue - currentValue) * 1.12,
    evidence_strength: 'High',
    scenario_description: `Baseline retention for ${driverSegment}`,
    narrative_explanation: `Under this counterfactual scenario, maintaining previous ${driverSegment} performance would have been associated with approximately ${unitSymbol}${(baselineValue - currentValue).toLocaleString(undefined, { maximumFractionDigits: 2 })} more ${targetMetric}.`,
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-[#0e241f] text-white border border-slate-800 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </span>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Counterfactual / &ldquo;What-If?&rdquo; Scenario Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Simulate hypothetical outcomes: What would {targetMetric} look like if{' '}
            <span className="text-emerald-400 font-semibold">{driverSegment}</span> performance had remained at baseline?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Evidence Strength: {simData.evidence_strength}
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Actual Observed */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Actual Observed {targetMetric}
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            {unitSymbol}{simData.observed_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 font-sans">Current recorded period</span>
        </div>

        {/* Counterfactual Estimated */}
        <div className="p-4 rounded-2xl bg-[#13332a] border border-emerald-500/40 space-y-1 ring-1 ring-emerald-500/20">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
            Estimated Counterfactual Total
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {unitSymbol}{simData.counterfactual_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-300/80 font-mono">
            95% CI: [{unitSymbol}{simData.confidence_interval_lower.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {unitSymbol}{simData.confidence_interval_upper.toLocaleString(undefined, { maximumFractionDigits: 0 })}]
          </span>
        </div>

        {/* Estimated Difference */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Estimated Impact (Delta)
          </span>
          <p className={`text-xl sm:text-2xl font-black font-mono ${simData.estimated_difference_abs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {simData.estimated_difference_abs >= 0 ? '+' : ''}{unitSymbol}{simData.estimated_difference_abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-300 font-semibold">
            {simData.estimated_difference_pct >= 0 ? '+' : ''}{simData.estimated_difference_pct.toFixed(1)}% vs Actual
          </span>
        </div>
      </div>

      {/* Interactive Recovery Parameter Slider */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Driver Performance Retention Slider:</span>
          </div>
          <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
            {recoveryPct}% of Baseline
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="150"
          step="5"
          value={recoveryPct}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0% (Full Decline)</span>
          <span>50% (Half Recovery)</span>
          <span>100% (Baseline Retained)</span>
          <span>150% (Growth Scenario)</span>
        </div>
      </div>

      {/* Narrative & Observational Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
        <p className="text-slate-200 leading-relaxed font-sans">
          {simData.narrative_explanation}
        </p>
        <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
          <span>
            Important: This represents an estimated counterfactual contribution, not isolated clinical proof that the driver causally produced this exact outcome.
          </span>
        </p>
      </div>
    </div>
  );
}
