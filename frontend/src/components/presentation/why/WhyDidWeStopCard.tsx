'use client';

import React from 'react';
import { HelpCircle, ShieldAlert, ArrowRightCircle } from 'lucide-react';
import { RootCauseNodeData } from '../../../lib/api';

interface WhyDidWeStopCardProps {
  rootNode: RootCauseNodeData;
}

export default function WhyDidWeStopCard({ rootNode }: WhyDidWeStopCardProps) {
  // Collect all stopping reasons from leaf nodes
  const stoppingPoints: Array<{ path: string; reason: string }> = [];

  function collectStopping(node: RootCauseNodeData, currentPath: string) {
    const nodeLabel = node.segment ? `${node.dimension}: ${node.segment}` : node.label;
    const newPath = currentPath ? `${currentPath} → ${nodeLabel}` : nodeLabel;

    if (node.stopping_reason) {
      stoppingPoints.push({
        path: newPath,
        reason: node.stopping_reason,
      });
    }

    if (node.children) {
      node.children.forEach((c) => collectStopping(c, newPath));
    }
  }

  collectStopping(rootNode, '');

  if (stoppingPoints.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
        <HelpCircle className="w-4 h-4 text-emerald-700" />
        <h4>Why Did the Investigation Stop Here?</h4>
      </div>

      <div className="space-y-2">
        {stoppingPoints.map((point, idx) => (
          <div key={idx} className="p-3 bg-white rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="font-mono font-semibold text-slate-800 text-[11px] flex items-center gap-1">
              <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{point.path}</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed pl-4.5">
              {point.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
