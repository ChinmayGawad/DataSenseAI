'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, Activity } from 'lucide-react';

interface SampleBenchmarksRowProps {
  onSelectSample: (sampleType: 'retail' | 'marketing' | 'healthcare') => void;
}

export default function SampleBenchmarksRow({ onSelectSample }: SampleBenchmarksRowProps) {
  return (
    <div className="space-y-3 pt-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
        Or explore with an instant benchmark dataset:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onSelectSample('retail')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400/80 hover:bg-emerald-50/20 text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Retail Sales
            </span>
          </div>
          <div className="font-semibold text-slate-800 text-xs">Global Superstore</div>
          <div className="text-[11px] text-slate-500 mt-0.5">5,320 rows • 18 columns</div>
        </button>

        <button
          onClick={() => onSelectSample('marketing')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400/80 hover:bg-emerald-50/20 text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-full">
              Marketing
            </span>
          </div>
          <div className="font-semibold text-slate-800 text-xs">Customer Campaigns</div>
          <div className="text-[11px] text-slate-500 mt-0.5">2,240 rows • 29 columns</div>
        </button>

        <button
          onClick={() => onSelectSample('healthcare')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400/80 hover:bg-emerald-50/20 text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-full">
              Healthcare
            </span>
          </div>
          <div className="font-semibold text-slate-800 text-xs">Patient Health Records</div>
          <div className="text-[11px] text-slate-500 mt-0.5">1,000 rows • 15 columns</div>
        </button>
      </div>
    </div>
  );
}
