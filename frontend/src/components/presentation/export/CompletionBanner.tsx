'use client';

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface CompletionBannerProps {
  onUploadAnother: () => void;
  onBackToDashboard: () => void;
}

export default function CompletionBanner({
  onUploadAnother,
  onBackToDashboard,
}: CompletionBannerProps) {
  return (
    <div className="relative p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Analysis Complete!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
          All 8 agents completed fact-checked investigation and generated clean deliverables.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onUploadAnother}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
        >
          Upload Another Dataset
        </button>

        <button
          onClick={onBackToDashboard}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <span>Back to Dashboard</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Handwritten Annotation in Corner */}
      <div className="sm:absolute bottom-4 right-6 text-xs font-serif italic text-emerald-800 rotate-[-4deg] opacity-90 pt-2 sm:pt-0">
        Different Data. Better Decisions. ✨
      </div>
    </div>
  );
}
