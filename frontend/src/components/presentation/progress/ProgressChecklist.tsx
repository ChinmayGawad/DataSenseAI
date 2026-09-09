'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  minProgress: number;
}

export const INVESTIGATION_STEPS: StepItem[] = [
  { id: 'read', label: 'Reading dataset', minProgress: 10 },
  { id: 'schema', label: 'Detecting column types', minProgress: 25 },
  { id: 'missing', label: 'Checking for missing values', minProgress: 40 },
  { id: 'duplicates', label: 'Identifying duplicates', minProgress: 55 },
  { id: 'cleaning', label: 'Cleaning and standardizing data', minProgress: 70 },
  { id: 'analysis', label: 'Running analysis (correlation, clustering, outliers...)', minProgress: 82 },
  { id: 'visualisations', label: 'Generating visualisations', minProgress: 92 },
  { id: 'insights', label: 'Preparing insights', minProgress: 100 },
];

interface ProgressChecklistProps {
  currentProgress: number;
}

export default function ProgressChecklist({ currentProgress }: ProgressChecklistProps) {
  const getStepStatus = (step: StepItem, index: number) => {
    if (currentProgress >= step.minProgress) return 'completed';
    const prevStepMin = index > 0 ? INVESTIGATION_STEPS[index - 1].minProgress : 0;
    if (currentProgress >= prevStepMin && currentProgress < step.minProgress) {
      return 'in_progress';
    }
    return 'pending';
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        Investigation Progress
      </h3>

      <div className="space-y-3.5">
        {INVESTIGATION_STEPS.map((step, idx) => {
          const status = getStepStatus(step, idx);

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                status === 'in_progress'
                  ? 'bg-emerald-50/70 border border-emerald-200/90 shadow-xs'
                  : status === 'completed'
                  ? 'bg-slate-50/70 border border-slate-100'
                  : 'bg-transparent border border-transparent text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : status === 'in_progress' ? (
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}

                <span
                  className={`text-xs sm:text-sm font-medium ${
                    status === 'completed'
                      ? 'text-slate-800'
                      : status === 'in_progress'
                      ? 'text-emerald-950 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status === 'completed'
                    ? 'text-emerald-700 bg-emerald-100/70'
                    : status === 'in_progress'
                    ? 'text-emerald-800 bg-emerald-200/80 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                {status === 'completed'
                  ? 'Completed'
                  : status === 'in_progress'
                  ? 'In Progress'
                  : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
