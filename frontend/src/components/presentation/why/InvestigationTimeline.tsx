'use client';

import React from 'react';
import { CheckCircle2, Clock, Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface TimelineStep {
  step: number;
  title: string;
  status: string;
  details?: string;
}

interface InvestigationTimelineProps {
  steps: TimelineStep[];
  evidenceScore: number;
  durationMs?: number;
}

export default function InvestigationTimeline({
  steps,
  evidenceScore,
  durationMs = 0,
}: InvestigationTimelineProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Autonomous Investigation Trail
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Evidence Score: {evidenceScore.toFixed(0)}/100
        </span>
      </div>

      <div className="space-y-3 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-emerald-100">
        {steps.map((item, idx) => (
          <div key={idx} className="relative flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 -ml-4 ring-4 ring-white shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {item.title}
              </p>
              {item.details && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {durationMs > 0 && (
        <div className="pt-2 text-[10px] font-mono text-slate-400 text-right border-t border-slate-100">
          Completed in {durationMs.toFixed(0)}ms via DeepSeek Harness Runtime
        </div>
      )}
    </div>
  );
}
