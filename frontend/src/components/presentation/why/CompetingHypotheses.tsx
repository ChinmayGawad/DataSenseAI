'use client';

import React from 'react';
import { Layers, ShieldCheck, TrendingDown, HelpCircle, CheckCircle2 } from 'lucide-react';
import { CompetingHypothesisData } from '../../../lib/api';

interface CompetingHypothesesProps {
  hypotheses: CompetingHypothesisData[];
  seasonalityDetected?: boolean;
}

export default function CompetingHypotheses({
  hypotheses,
  seasonalityDetected = false,
}: CompetingHypothesesProps) {
  if (!hypotheses || hypotheses.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Competing Explanations &amp; Hypotheses
          </h3>
        </div>

        <span className="text-[11px] text-slate-400 font-semibold">
          Ranked by Evidence Confidence
        </span>
      </div>

      <div className="space-y-3">
        {hypotheses.map((hypo, idx) => {
          const isPrimary = hypo.type === 'PRIMARY';
          const isSeason = hypo.type === 'SEASONALITY';

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isPrimary
                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/10'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {hypo.hypothesis}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPrimary 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : isSeason 
                        ? 'bg-blue-100 text-blue-800 border-blue-300' 
                        : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    }`}>
                      {hypo.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {hypo.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {hypo.confidence.toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">evidence</span>
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPrimary ? 'bg-emerald-500' : isSeason ? 'bg-blue-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, hypo.confidence))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
