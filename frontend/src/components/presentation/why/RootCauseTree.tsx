'use client';

import React, { useState } from 'react';
import {
  GitFork,
  ChevronDown,
  ChevronRight,
  Calculator,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { RootCauseNodeData, EvidencePackageData } from '../../../lib/api';

interface RootCauseTreeProps {
  rootNode: RootCauseNodeData;
  onSelectEvidence: (evidence: EvidencePackageData) => void;
}

interface TreeNodeItemProps {
  node: RootCauseNodeData;
  isRoot?: boolean;
  onSelectEvidence: (evidence: EvidencePackageData) => void;
}

function TreeNodeItem({ node, isRoot = false, onSelectEvidence }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'PRIMARY_DRIVER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Primary Driver
          </span>
        );
      case 'SECONDARY_DRIVER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            Secondary Driver
          </span>
        );
      case 'SUPPORTING_FACTOR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Supporting Factor
          </span>
        );
      case 'ASSOCIATED':
      case 'ASSOCIATED_FACTOR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Associated Factor
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
            Low Sample Size
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Target Metric
          </span>
        );
    }
  };

  const isDecline = node.delta_pct < 0;

  return (
    <div className="relative pl-6 sm:pl-8 space-y-3">
      {/* Node Card */}
      <div 
        className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 border ${
          isRoot
            ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-1 ring-emerald-500/20'
            : node.classification === 'PRIMARY_DRIVER'
            ? 'bg-white border-emerald-300/80 shadow-xs hover:border-emerald-400 ring-1 ring-emerald-500/10'
            : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Node Identity & Role */}
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isRoot ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-sm sm:text-base tracking-tight truncate ${isRoot ? 'text-white' : 'text-slate-900'}`}>
                  {node.segment ? `${node.dimension}: ${node.segment}` : node.label}
                </span>
                {getClassificationBadge(node.classification)}
              </div>

              {node.segment && (
                <span className={`text-[11px] font-mono mt-0.5 ${isRoot ? 'text-slate-400' : 'text-slate-500'}`}>
                  Cohort Size: N = {node.sample_size?.toLocaleString()} observations
                </span>
              )}
            </div>
          </div>

          {/* Metrics, Badges & Evidence Action */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Delta Badge */}
            <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
              isDecline 
                ? isRoot ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200' 
                : isRoot ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isDecline ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>{node.delta_pct >= 0 ? '+' : ''}{node.delta_pct?.toFixed(1)}%</span>
            </div>

            {/* Contribution Pill */}
            {!isRoot && (
              <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                <span>{node.contribution_pct?.toFixed(1)}%</span>
                <span className="text-[10px] text-emerald-600 font-normal">contrib</span>
              </div>
            )}

            {/* Confidence Score Pill */}
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-xl border shrink-0 ${
              isRoot ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className="font-mono font-bold">{node.confidence_score?.toFixed(0)}</span>
              <span className="text-[10px] text-slate-400">/100 conf</span>
            </div>

            {/* Show Evidence Button */}
            {node.evidence && (
              <button
                onClick={() => onSelectEvidence(node.evidence!)}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  isRoot
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 hover:bg-emerald-400'
                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Show Evidence</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistical Test Summary Line */}
        {node.statistical_test && (
          <div className={`mt-2.5 pt-2 text-[11px] flex items-center justify-between border-t ${
            isRoot ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
          }`}>
            <span className="font-mono">
              Validated via: {node.statistical_test} ({node.effect_size_summary})
            </span>
          </div>
        )}

        {/* Stopping Reason Callout on Leaf Nodes */}
        {node.stopping_reason && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{node.stopping_reason}</span>
          </div>
        )}
      </div>

      {/* Recursive Children Branches with Connector Lines */}
      {hasChildren && isExpanded && (
        <div className="space-y-3 relative before:absolute before:left-3 sm:before:left-4 before:top-0 before:bottom-3 before:w-[2px] before:bg-slate-200/90">
          {node.children.map((childNode) => (
            <TreeNodeItem
              key={childNode.id}
              node={childNode}
              onSelectEvidence={onSelectEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RootCauseTree({ rootNode, onSelectEvidence }: RootCauseTreeProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <GitFork className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Recursive Root-Cause / Insight Tree
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Interactive multi-level investigation path showing exact contribution breakdown, sample sizes, and stopping points.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fully Autonomous Multi-Level Drilldown</span>
        </div>
      </div>

      {/* Root Node & Recursive Hierarchy */}
      <div className="-ml-6 sm:-ml-8">
        <TreeNodeItem
          node={rootNode}
          isRoot={true}
          onSelectEvidence={onSelectEvidence}
        />
      </div>
    </div>
  );
}
