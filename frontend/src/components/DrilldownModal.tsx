'use client';

import React from 'react';
import { X, Search, ShieldCheck, ArrowRight, Lightbulb, AlertTriangle } from 'lucide-react';
import { DrilldownResponse } from '../lib/api';
import PlotlyChart from './PlotlyChart';

interface DrilldownModalProps {
  drilldown: DrilldownResponse | null;
  onClose: () => void;
}

export default function DrilldownModal({ drilldown, onClose }: DrilldownModalProps) {
  if (!drilldown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                Autonomous Deep Dive
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{drilldown.deep_dive_title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Investigation Summary & Root Cause
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {drilldown.investigation_summary}
          </p>
        </div>

        {/* Supporting Drilldown Chart */}
        {drilldown.supporting_chart && (
          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {drilldown.supporting_chart.title}
              </h4>
              <span className="text-[11px] text-slate-400">
                {drilldown.supporting_chart.key_takeaway}
              </span>
            </div>
            <PlotlyChart
              data={drilldown.supporting_chart.plotly_data}
              layout={drilldown.supporting_chart.plotly_layout}
              className="h-[280px]"
            />
          </div>
        )}

        {/* Granular Evidence Points */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Mathematical & Segment Evidence:
          </h4>
          <div className="space-y-2.5">
            {drilldown.evidence_points.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-xs text-slate-300"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </div>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3">
            <Lightbulb className="w-4 h-4" />
            Recommended Operational Actions:
          </div>
          <div className="grid grid-cols-1 gap-2">
            {drilldown.recommended_actions.map((act, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-300 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors active:scale-[0.98]"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
}
