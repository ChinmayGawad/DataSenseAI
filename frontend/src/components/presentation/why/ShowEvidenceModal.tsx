'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Calculator, Activity, HelpCircle, Layers } from 'lucide-react';
import { EvidencePackageData } from '../../../lib/api';

interface ShowEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidencePackageData | null;
}

export default function ShowEvidenceModal({
  isOpen,
  onClose,
  evidence,
}: ShowEvidenceModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !evidence) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold">
                <Calculator className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Ground-Truth Evidence Trail
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic mathematical and statistical proof behind{' '}
              <span className="font-semibold text-slate-800">
                {evidence.segment ? `${evidence.dimension}: ${evidence.segment}` : evidence.target_metric}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Shift Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Baseline</span>
            <p className="text-sm font-bold text-slate-900">
              {evidence.unit_symbol || ''}{evidence.baseline_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">N = {evidence.sample_size_before.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Current</span>
            <p className="text-sm font-bold text-slate-900">
              {evidence.unit_symbol || ''}{evidence.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">N = {evidence.sample_size_after.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Segment Delta</span>
            <p className={`text-sm font-bold ${evidence.delta_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {evidence.delta_pct >= 0 ? '+' : ''}{evidence.delta_pct.toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              Δ {evidence.unit_symbol || ''}{evidence.delta_abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800">Contribution</span>
            <p className="text-sm font-extrabold text-emerald-900">
              {evidence.contribution_pct.toFixed(1)}%
            </p>
            <span className="text-[10px] text-emerald-700">of total shift</span>
          </div>
        </div>

        {/* Step-by-Step Mathematical Derivation */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mathematical Derivation</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 overflow-x-auto shadow-inner">
            <div className="text-emerald-400 font-semibold text-[11px] pb-1 border-b border-slate-800">
              {evidence.formula_breakdown}
            </div>
            {evidence.step_by_step_calculation.map((step, idx) => (
              <div key={idx} className="text-slate-300 text-[11px] leading-relaxed">
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Statistical Hypothesis Test & Effect Size */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Statistical Validation: {evidence.statistical_test_name}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              p = {evidence.p_value.toFixed(5)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Test Statistic</span>
              <p className="font-mono font-bold text-slate-800">{evidence.test_statistic.toFixed(4)}</p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">{evidence.effect_size_metric}</span>
              <p className="font-mono font-bold text-slate-800">{evidence.effect_size_value.toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Guardrail Assessments: Seasonality & Confounding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Confounder Audit</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {evidence.confounding_assessment}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Seasonality Audit</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {evidence.seasonality_assessment}
            </p>
          </div>
        </div>

        {/* Subsegment Data Table (if available) */}
        {evidence.subsegment_table && evidence.subsegment_table.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800">Sub-Segment Breakdown</span>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="p-2.5 font-semibold">Dimension</th>
                    <th className="p-2.5 font-semibold">Segment</th>
                    <th className="p-2.5 font-semibold text-right">Delta %</th>
                    <th className="p-2.5 font-semibold text-right">Contribution %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidence.subsegment_table.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-medium text-slate-700">{row.dimension}</td>
                      <td className="p-2.5 font-bold text-slate-900">{row.segment}</td>
                      <td className={`p-2.5 text-right font-mono font-bold ${row.delta_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {row.delta_pct >= 0 ? '+' : ''}{Number(row.delta_pct).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {Number(row.contrib_pct).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          <p>
            Calculated deterministically via SciPy & Pandas. Verified by AI Fact Checker agent.
          </p>
        </div>
      </div>
    </div>
  );
}
