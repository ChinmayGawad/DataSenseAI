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
  const getCategoryStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case 'growth':
      case 'trend':
        return {
          icon: <TrendingUp className="w-5 h-5 text-emerald-700" />,
          bg: 'bg-emerald-50 border border-emerald-200',
        };
      case 'customer':
        return {
          icon: <Users className="w-5 h-5 text-blue-700" />,
          bg: 'bg-blue-50 border border-blue-200',
        };
      case 'discount':
      case 'correlation':
        return {
          icon: <Percent className="w-5 h-5 text-amber-700" />,
          bg: 'bg-amber-50 border border-amber-200',
        };
      case 'anomaly':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-700" />,
          bg: 'bg-rose-50 border border-rose-200',
        };
      case 'cluster':
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-purple-700" />,
          bg: 'bg-purple-50 border border-purple-200',
        };
    }
  };

  const catStyle = getCategoryStyles(insight.category);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-slate-300 transition-all">
      <div className="flex items-start gap-4">
        {/* Category Circular Icon Badge */}
        <div className={`w-11 h-11 rounded-2xl ${catStyle.bg} flex items-center justify-center shrink-0 shadow-2xs`}>
          {catStyle.icon}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              {insight.title}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Fact
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {insight.statement}
          </p>
        </div>
      </div>

      {/* Proof Expander Toggle & Investigate Button */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>{loadingDrilldown ? 'Investigating...' : 'Investigate This Finding'}</span>
            <span className="text-emerald-600">→</span>
          </button>
        )}
      </div>

      {/* Expandable Mathematical Proof Box */}
      {isExpanded && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono animate-in fade-in duration-200">
          <div className="text-slate-600 font-sans font-semibold text-[11px] flex items-center justify-between">
            <span>Verified by Fact Checker Agent:</span>
            <span className="text-emerald-700 font-mono">0.0% Hallucination</span>
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
