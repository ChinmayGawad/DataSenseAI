'use client';

import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Database,
} from 'lucide-react';

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

function getKpiVisuals(label: string) {
  const l = label.toLowerCase();
  if (
    l.includes('revenue') ||
    l.includes('sales') ||
    l.includes('spend') ||
    l.includes('price') ||
    l.includes('cost') ||
    l.includes('budget') ||
    l.includes('turnover') ||
    l.includes('profit')
  ) {
    return {
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200/80',
    };
  }
  if (
    l.includes('customer') ||
    l.includes('user') ||
    l.includes('patient') ||
    l.includes('lead') ||
    l.includes('account') ||
    l.includes('buyer') ||
    l.includes('entity') ||
    l.includes('people') ||
    l.includes('member')
  ) {
    return {
      icon: <Users className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200/80',
    };
  }
  if (
    l.includes('conversion') ||
    l.includes('margin') ||
    l.includes('rate') ||
    l.includes('score') ||
    l.includes('roi') ||
    l.includes('efficiency') ||
    l.includes('ratio')
  ) {
    return {
      icon: <Zap className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200/80',
    };
  }
  if (
    l.includes('observation') ||
    l.includes('record') ||
    l.includes('dataset') ||
    l.includes('data') ||
    l.includes('feature') ||
    l.includes('column')
  ) {
    return {
      icon: <Database className="w-4 h-4 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-200/80',
    };
  }
  return {
    icon: <TrendingUp className="w-4 h-4 text-teal-600" />,
    bg: 'bg-teal-50 border-teal-200/80',
  };
}

export default function KpiCardsGrid({ kpis }: KpiCardsGridProps) {
  if (!kpis || kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {kpis.map((kpi) => {
        const visuals = getKpiVisuals(kpi.label);
        const deltaTrimmed = kpi.delta?.trim() || '';
        const isUp = deltaTrimmed.startsWith('+');
        const isDown = deltaTrimmed.startsWith('-');

        return (
          <div
            key={kpi.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300/90 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group min-h-[160px]"
          >
            {/* Top Bar: Category Icon (Left) + Delta/Status Badge (Right) */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${visuals.bg}`}
              >
                {visuals.icon}
              </div>

              {/* Delta Badge */}
              {deltaTrimmed && (
                <div
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border transition-colors ${
                    isUp
                      ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200'
                      : isDown
                      ? 'text-rose-700 bg-rose-50/90 border-rose-200'
                      : 'text-slate-600 bg-slate-100/90 border-slate-200'
                  }`}
                >
                  {isUp && <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />}
                  {isDown && <ArrowDownRight className="w-3 h-3 text-rose-600 shrink-0" />}
                  <span className="whitespace-nowrap">{deltaTrimmed}</span>
                </div>
              )}
            </div>

            {/* Middle Section: Full-Width Title Label & Primary Value */}
            <div className="space-y-1">
              <h4
                className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-snug line-clamp-2 break-words"
                title={kpi.label}
              >
                {kpi.label}
              </h4>
              <div
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight tabular-nums break-words"
                title={kpi.value}
              >
                {kpi.value}
              </div>
            </div>

            {/* Bottom Section: Descriptive Subtext */}
            {kpi.subtext && (
              <p
                className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2"
                title={kpi.subtext}
              >
                {kpi.subtext}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
