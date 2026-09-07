'use client';

import React from 'react';
import { CheckCircle2, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface CleaningMetricCardsProps {
  missingFixed: number;
  duplicatesRemoved: number;
  formatIssues: number;
  standardized: number;
}

export default function CleaningMetricCards({
  missingFixed,
  duplicatesRemoved,
  formatIssues,
  standardized,
}: CleaningMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Missing Values */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Missing Values
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {missingFixed}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ➔ Fixed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Imputed via median & mode</p>
        </div>
      </div>

      {/* Card 2: Duplicates */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Duplicate Rows
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {duplicatesRemoved}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ➔ Removed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Full-row deduplication</p>
        </div>
      </div>

      {/* Card 3: Format Issues */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Format Issues
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatIssues}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              ➔ Fixed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Standardized dates & currency</p>
        </div>
      </div>

      {/* Card 4: Inconsistent Entries */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Inconsistent Entries
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {standardized}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              ➔ Standardized
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Casing & whitespace trimmed</p>
        </div>
      </div>
    </div>
  );
}
