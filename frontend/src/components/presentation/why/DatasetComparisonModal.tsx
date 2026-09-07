'use client';

import React, { useState } from 'react';
import { X, GitCompare, TrendingUp, TrendingDown, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { DatasetComparisonResponse, compareDatasets } from '../../../lib/api';

interface DatasetComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJobId: string;
}

export default function DatasetComparisonModal({
  isOpen,
  onClose,
  currentJobId,
}: DatasetComparisonModalProps) {
  const [targetMetric, setTargetMetric] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<DatasetComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await compareDatasets(currentJobId, currentJobId, targetMetric || undefined);
      setComparisonResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to compare datasets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <GitCompare className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Dataset Comparison &amp; &ldquo;What Changed?&rdquo;
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Align datasets, detect top metric shifts, and identify primary segment drivers.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Trigger */}
        {!comparisonResult && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Compare this dataset against earlier baseline partitions to discover all diverging metrics and category changes.
            </p>
            <button
              onClick={handleRunComparison}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Analyzing Differences...' : 'Run Automated Comparison →'}
            </button>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{comparisonResult.summary_headline}</span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Shifted Metrics Breakdown
              </span>

              {comparisonResult.metric_comparisons.map((m, idx) => {
                const isDown = m.delta_pct < 0;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{m.metric}</span>
                      <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                        isDown ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        <span>{m.delta_pct >= 0 ? '+' : ''}{m.delta_pct}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>Baseline Sum: <span className="font-mono font-semibold text-slate-800">{m.sum_a.toLocaleString()}</span></div>
                      <div>Current Sum: <span className="font-mono font-semibold text-slate-800">{m.sum_b.toLocaleString()}</span></div>
                    </div>

                    {m.top_divergent_segments && m.top_divergent_segments.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                        Top divergent driver: <span className="font-semibold text-slate-800">{m.top_divergent_segments[0].segment}</span> ({m.top_divergent_segments[0].dimension}) with delta {m.top_divergent_segments[0].delta_pct}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
