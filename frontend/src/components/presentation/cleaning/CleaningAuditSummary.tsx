'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CleaningAuditSummary() {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            Data cleaning completed successfully!
          </h4>
          <p className="text-xs text-slate-500">
            Your dataset is now clean, mathematically validated, and ready for deep investigation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero critical missing values remaining in features</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Outliers flagged without destroying legitimate signals</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Categorical column cardinalities normalized</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Target schema validated for automated visualizations</span>
        </div>
      </div>
    </div>
  );
}
