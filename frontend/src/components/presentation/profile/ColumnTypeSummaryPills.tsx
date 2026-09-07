'use client';

import React from 'react';
import { Calendar, Hash, Layers, Type } from 'lucide-react';

interface ColumnTypeSummaryPillsProps {
  numericCount: number;
  categoricalCount: number;
  dateCount: number;
  textCount: number;
}

export default function ColumnTypeSummaryPills({
  numericCount,
  categoricalCount,
  dateCount,
  textCount,
}: ColumnTypeSummaryPillsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
      <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
        <Hash className="w-3.5 h-3.5 text-blue-600" />
        <span>{numericCount} Numeric Columns</span>
      </div>

      <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
        <Layers className="w-3.5 h-3.5 text-purple-600" />
        <span>{categoricalCount} Categorical Columns</span>
      </div>

      <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
        <span>{dateCount} Date Column</span>
      </div>

      <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
        <Type className="w-3.5 h-3.5 text-amber-600" />
        <span>{textCount} Text Columns</span>
      </div>
    </div>
  );
}
