'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ExportOptionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  hoverBorderColor: string;
  actions: ActionButton[];
}

export default function ExportOptionCard({
  title,
  description,
  icon: Icon,
  iconBgColor,
  iconTextColor,
  hoverBorderColor,
  actions,
}: ExportOptionCardProps) {
  return (
    <div
      className={`p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 ${hoverBorderColor} transition-all`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl ${iconBgColor} border border-slate-200/60 ${iconTextColor} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={act.onClick}
            disabled={act.disabled}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
}
