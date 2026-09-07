'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface ComparisonGaugeProps {
  beforeScore?: number;
  beforePercentage?: number;
  afterScore?: number;
  afterPercentage?: number;
  label?: string;
  subtext?: string;
  message?: string;
}

export default function ComparisonGauge({
  beforeScore,
  beforePercentage,
  afterScore,
  afterPercentage,
  label,
  subtext,
  message = "Data cleaning completed! Your dataset is now clean and ready for analysis.",
}: ComparisonGaugeProps) {
  const bScore = beforeScore ?? beforePercentage ?? 72;
  const aScore = afterScore ?? afterPercentage ?? 98;
  const displayMsg = subtext || message;
  const renderCircle = (val: number, color: string, label: string) => {
    const size = 110;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (val / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{val}%</span>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium mt-2">{label}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      {/* Dual Gauge */}
      <div className="flex items-center justify-center gap-6 sm:gap-8">
        {renderCircle(bScore, '#0ea5e9', 'Before Cleaning')}
        <div className="p-2 rounded-full bg-slate-100 text-slate-400">
          <ArrowRight className="w-5 h-5" />
        </div>
        {renderCircle(aScore, '#10b981', 'After Cleaning')}
      </div>

      {/* Confirmation Box */}
      <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-950">Data cleaning completed!</h4>
          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">{displayMsg}</p>
        </div>
      </div>
    </div>
  );
}
