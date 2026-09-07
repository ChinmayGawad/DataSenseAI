'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  Percent,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FactCheckedInsight } from '../../../lib/api';

interface InsightCardItemProps {
  insight: FactCheckedInsight;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDrilldown?: () => void;
  loadingDrilldown?: boolean;
}

export default function InsightCardItem({
  insight,
  isExpanded,
  onToggleExpand,
  onDrilldown,
  loadingDrilldown,
}: InsightCardItemProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'growth':
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'customer':
      case 'cluster':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'discount':
      case 'correlation':
        return <Percent className="w-4 h-4 text-purple-600" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            {getCategoryIcon(insight.category)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {insight.title}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {insight.category}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Verified Claim
        </span>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
        {insight.statement}
      </p>

      {/* Proof Expander Toggle */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Math Proof' : 'View Ground-Truth Proof'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {onDrilldown && (
          <button
            onClick={onDrilldown}
            disabled={loadingDrilldown}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {loadingDrilldown ? 'Analyzing...' : 'Deep Dive →'}
          </button>
        )}
      </div>

      {/* Expandable Mathematical Proof Box */}
      {isExpanded && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono animate-in fade-in duration-200">
          <div className="text-slate-500 font-sans font-semibold text-[11px]">
            Verified by Fact Checker Agent:
          </div>
          <pre className="text-[11px] text-slate-800 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto">
            {JSON.stringify(insight.math_proof, null, 2)}
          </pre>
          <p className="text-[11px] font-sans text-slate-500 italic">
            {insight.verification_notes}
          </p>
        </div>
      )}
    </div>
  );
}
