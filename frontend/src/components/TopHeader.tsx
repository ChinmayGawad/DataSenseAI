'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Calendar, RotateCcw, Sparkles, Menu, BarChart, Activity } from 'lucide-react';
import { checkBackendHealth, SystemHealthStatus } from '../lib/api';

interface TopHeaderProps {
  currentView: string;
  onReset?: () => void;
  showTimeFilter?: boolean;
  onOpenChat?: () => void;
  canChat?: boolean;
  onToggleMenu?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function TopHeader({
  currentView,
  onReset,
  showTimeFilter,
  onOpenChat,
  canChat,
  onToggleMenu,
  onToggleMobileMenu,
}: TopHeaderProps) {
  const handleMenuClick = onToggleMenu || onToggleMobileMenu;
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus>({ isOnline: false });

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      const status = await checkBackendHealth();
      if (mounted) {
        setHealthStatus(status);
      }
    };
    probe();
    const interval = setInterval(probe, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left Section: Menu Toggle Button + View Hierarchy Indicator */}
      <div className="flex items-center gap-3.5">
        {handleMenuClick && (
          <button
            onClick={handleMenuClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white transition-all shadow-xs cursor-pointer active:scale-95 group focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Open navigation menu bar"
          >
            <Menu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold tracking-wide">Menu</span>
          </button>
        )}

        <div className="flex items-center gap-2 pl-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
            <BarChart className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
            DataSense AI
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-xs font-bold text-slate-800 capitalize">
            {currentView.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Backend vs Demo Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
            healthStatus.isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
              : 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs'
          }`}
          title={
            healthStatus.isOnline
              ? `Connected to FastAPI Backend (v${healthStatus.version}) • ${healthStatus.latencyMs}ms latency`
              : 'Running in Offline Simulation Mode (Demo fallback active)'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              healthStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="font-semibold hidden sm:inline">
            {healthStatus.isOnline ? 'Live Backend' : 'Demo Mode'}
          </span>
          {healthStatus.isOnline && healthStatus.latencyMs !== undefined && (
            <span className="text-[10px] text-emerald-600/80 hidden lg:inline">
              ({healthStatus.latencyMs}ms)
            </span>
          )}
        </div>

        {/* Ask AI Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Ask AI</span>
          </button>
        )}

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
