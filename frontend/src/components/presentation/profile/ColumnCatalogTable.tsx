'use client';

import React from 'react';
import { Calendar, Hash, Layers, Type } from 'lucide-react';
import { ColumnProfileItem } from '../../../lib/api';

interface ColumnCatalogTableProps {
  columns: ColumnProfileItem[];
}

export default function ColumnCatalogTable({ columns }: ColumnCatalogTableProps) {
  const getTypeBadge = (typeStr: string) => {
    const t = typeStr.toLowerCase();
    if (t.includes('date') || t.includes('time')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Calendar className="w-3 h-3 text-emerald-600" />
          Date
        </span>
      );
    }
    if (t.includes('num') || t.includes('int') || t.includes('float')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Hash className="w-3 h-3 text-blue-600" />
          Numeric
        </span>
      );
    }
    if (t.includes('cat') || t.includes('bool') || t.includes('id')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="w-3 h-3 text-purple-600" />
          Categorical
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Type className="w-3 h-3 text-amber-600" />
        Text
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4">Column Name</th>
              <th className="py-3.5 px-4">Detected Type</th>
              <th className="py-3.5 px-4 text-right">Unique Values</th>
              <th className="py-3.5 px-4 text-right">Missing Values</th>
              <th className="py-3.5 px-6">Sample Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {columns.map((col, idx) => (
              <tr key={col.name} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                  {idx + 1}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-800">
                  {col.name}
                </td>
                <td className="py-3.5 px-4">{getTypeBadge(col.detected_type)}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                  {col.unique_count.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {col.null_count > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-[11px]">
                      {col.null_count.toLocaleString()} ({col.null_percentage || 0}%)
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium font-mono">
                      0 (0%)
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                  {Array.isArray(col.sample_values) && col.sample_values.length > 0
                    ? col.sample_values.slice(0, 3).join(', ')
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
