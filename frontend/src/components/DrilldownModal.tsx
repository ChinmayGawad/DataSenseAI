'use client';

import React, { useEffect } from 'react';
import { X, Search, ShieldCheck, ArrowRight, Lightbulb } from 'lucide-react';
import { DrilldownResponse } from '../lib/api';
import PlotlyChart from './PlotlyChart';

interface DrilldownModalProps {
  drilldown: DrilldownResponse | null;
  onClose: () => void;
}

export default function DrilldownModal({ drilldown, onClose }: DrilldownModalProps) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!drilldown) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-emerald-800 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                Autonomous Deep Dive
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1.5">{drilldown.deep_dive_title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Investigation Summary &amp; Root Cause</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {drilldown.investigation_summary}
          </p>
        </div>

        {/* Supporting Drilldown Chart */}
        {drilldown.supporting_chart && (
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {drilldown.supporting_chart.title}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {drilldown.supporting_chart.key_takeaway}
              </span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-200/80">
              <PlotlyChart
                data={drilldown.supporting_chart.plotly_data}
                layout={drilldown.supporting_chart.plotly_layout}
                className="h-[280px]"
              />
            </div>
          </div>
        )}

        {/* Granular Evidence Points */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mathematical &amp; Segment Evidence
          </h4>
          <div className="space-y-2">
            {drilldown.evidence_points.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 border border-emerald-200">
                  {idx + 1}
                </div>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Recommended Operational Actions</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {drilldown.recommended_actions.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-800 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0c1815] hover:bg-[#152e28] rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
}
