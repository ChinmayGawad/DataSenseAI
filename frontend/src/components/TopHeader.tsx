'use client';

import React from 'react';
import { Bell, ChevronDown, Calendar, RotateCcw } from 'lucide-react';

interface TopHeaderProps {
  currentView: string;
  onReset?: () => void;
  showTimeFilter?: boolean;
}

export default function TopHeader({ currentView, onReset, showTimeFilter }: TopHeaderProps) {
  return (
    <header className="h-16 px-6 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
      {/* View indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          DataSense AI
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-700 capitalize">
          {currentView.replace('_', ' ')}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Optional Time Filter on Dashboard view */}
        {showTimeFilter && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Last 6 Months</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        )}

        {/* New Session Reset */}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Dataset</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#11241f] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            S
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-800">Sahil</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
