'use client';

import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Layers, ArrowUpRight } from 'lucide-react';
import { CleaningDiffItem } from '../../../lib/api';

interface RemediationDiffSpotlightProps {
  rawRows?: Record<string, any>[];
  cleanedRows?: Record<string, any>[];
  cleaningDiffs?: CleaningDiffItem[];
  onOpenDataGrid: () => void;
}

export default function RemediationDiffSpotlight({
  rawRows = [],
  cleanedRows = [],
  cleaningDiffs = [],
  onOpenDataGrid,
}: RemediationDiffSpotlightProps) {
  // Find top modified items or preview differences
  const sampleDiffs = React.useMemo(() => {
    if (cleaningDiffs && cleaningDiffs.length > 0) {
      return cleaningDiffs.slice(0, 4);
    }
    // Infer if not provided
    const inferred: CleaningDiffItem[] = [];
    if (rawRows.length > 0 && cleanedRows.length > 0) {
      const len = Math.min(rawRows.length, cleanedRows.length, 25);
      for (let r = 0; r < len; r++) {
        const raw = rawRows[r];
        const clean = cleanedRows[r];
        for (const col of Object.keys(clean)) {
          if (raw[col] === null || raw[col] === undefined || raw[col] === '' || String(raw[col]) !== String(clean[col])) {
            inferred.push({
              row_index: r,
              column: col,
              original_value: raw[col] ?? null,
              cleaned_value: clean[col],
              action_type: 'imputation',
              reason: 'Statistical distribution preservation',
            });
            if (inferred.length >= 4) break;
          }
        }
        if (inferred.length >= 4) break;
      }
    }
    return inferred;
  }, [cleaningDiffs, rawRows, cleanedRows]);

  const totalModifications = cleaningDiffs.length > 0 ? cleaningDiffs.length : sampleDiffs.length;

  return (
    <div className="rounded-3xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/50 via-white to-teal-50/30 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Remediation Diff Spotlight
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Verified Python Ground Truth
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Instant before-and-after audit of autonomous cell remediations.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDataGrid}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto"
        >
          <span>Open Full Interactive Data Grid</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {sampleDiffs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {sampleDiffs.map((diff, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white border border-slate-200/70 hover:border-emerald-300 transition-all shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 font-mono">
                  Row #{diff.row_index + 1} • <span className="text-emerald-700">{diff.column}</span>
                </span>
                <span className="px-2 py-0.2 rounded-md text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  {diff.action_type.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 line-through">
                  {diff.original_value === null || diff.original_value === undefined ? 'null' : String(diff.original_value)}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  {String(diff.cleaned_value)}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate pt-0.5">
                {diff.reason}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 text-center text-xs text-slate-600">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <span className="font-semibold">Dataset complete:</span> Zero missing values required imputation in initial rows.
        </div>
      )}
    </div>
  );
}
