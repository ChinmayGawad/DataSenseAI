'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ProgressTipCardProps {
  tipText?: string;
}

export default function ProgressTipCard({
  tipText = "You can explore the automatically generated results, inspect data quality metrics, and download cleaned spreadsheets once the analysis is complete."
}: ProgressTipCardProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 shadow-xs">
      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4" />
      </div>
      <div className="text-xs text-amber-900 leading-relaxed">
        <span className="font-bold">Tip:</span> {tipText}
      </div>
    </div>
  );
}
