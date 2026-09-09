'use client';

import React from 'react';
import { Info, Sparkles, Zap, Lightbulb } from 'lucide-react';
import { ChartConfig } from '../../../lib/api';
import PlotlyChart from '../../PlotlyChart';

interface ChartCardProps {
  chart: ChartConfig;
  subtitle: string;
  isWhyOpen: boolean;
  onToggleWhy: () => void;
  height?: number;
}

export default function ChartCard({
  chart,
  subtitle,
  isWhyOpen,
  onToggleWhy,
  height = 280,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{chart.title}</h3>
            {chart.decision_rule && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-emerald-600 mr-1" />
                {chart.decision_rule}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <button
          onClick={onToggleWhy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 border border-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>Why this chart?</span>
        </button>
      </div>

      {isWhyOpen && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs animate-in fade-in duration-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Smart Rule-Based Visualization Selection
            </div>
            {chart.detected_inputs && (
              <span className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-emerald-200">
                Input: {chart.detected_inputs}
              </span>
            )}
          </div>
          <p className="leading-relaxed text-slate-700">{chart.why_chosen}</p>
        </div>
      )}

      <div style={{ height: `${height}px` }} className="w-full">
        <PlotlyChart config={chart} />
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-700 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{chart.key_takeaway}</span>
        </span>
      </div>
    </div>
  );
}
