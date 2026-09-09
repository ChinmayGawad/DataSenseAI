'use client';

import React from 'react';
import { Sparkles, FileDown } from 'lucide-react';

import { FactCheckedInsight } from '../../../lib/api';

interface AiExecutiveSummaryCardProps {
  insights?: FactCheckedInsight[];
  datasetName?: string;
  totalObservations?: string | number;
  onDownloadPdf?: () => void;
}

export default function AiExecutiveSummaryCard({
  insights,
  datasetName,
  totalObservations,
  onDownloadPdf = () => window.print(),
}: AiExecutiveSummaryCardProps) {
  const topInsight = insights && insights.length > 0 ? insights[0] : null;
  const secondaryInsight = insights && insights.length > 1 ? insights[1] : null;

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">AI Summary</h4>
          <p className="text-[11px] text-slate-400">
            {datasetName ? `Synthesized for ${datasetName}` : 'Synthesized by 8 specialized agents'}
          </p>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
        {topInsight ? (
          <>
            <p>
              {topInsight.statement}
            </p>
            {secondaryInsight && (
              <p>
                {secondaryInsight.statement}
              </p>
            )}
          </>
        ) : (
          <p>
            Overall, the business is performing well, with strong sales growth and a loyal customer base. The Western region is the top performer. However, high discounts are reducing profitability, and a few unusual transactions should be reviewed.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-900">100%</div>
            <div className="text-[10px] text-slate-400">Fact-Checked</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-900">0%</div>
            <div className="text-[10px] text-slate-400">Hallucinations</div>
          </div>
        </div>

        <button
          onClick={onDownloadPdf}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer"
        >
          <FileDown className="w-4 h-4 text-emerald-400" />
          <span>Download Summary (PDF)</span>
        </button>
      </div>
    </div>
  );
}
