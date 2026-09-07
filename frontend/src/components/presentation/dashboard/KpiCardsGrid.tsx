'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface KpiItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  subtext: string;
}

interface KpiCardsGridProps {
  kpis: KpiItem[];
}

export default function KpiCardsGrid({ kpis }: KpiCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {kpi.label}
            </span>
            <div
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                kpi.isPositive
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border border-rose-200'
              }`}
            >
              {kpi.isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
              )}
              <span>{kpi.delta}</span>
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {kpi.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{kpi.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
