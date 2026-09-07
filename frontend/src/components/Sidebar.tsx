'use client';

import React from 'react';
import {
  Home,
  UploadCloud,
  TableProperties,
  Sparkles,
  BarChart3,
  LayoutDashboard,
  Lightbulb,
  DownloadCloud,
  BarChart,
  GitFork,
  X,
} from 'lucide-react';

export type NavView =
  | 'landing'
  | 'upload'
  | 'analysis'
  | 'profile'
  | 'cleaning'
  | 'dashboard'
  | 'why'
  | 'insights'
  | 'export';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  hasDataset: boolean;
  hasAnalyzed: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  hasDataset,
  hasAnalyzed,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    { id: 'landing' as NavView, label: 'Home', icon: Home, enabled: true },
    { id: 'upload' as NavView, label: 'Upload', icon: UploadCloud, enabled: true },
    { id: 'profile' as NavView, label: 'Data Profile', icon: TableProperties, enabled: hasDataset },
    { id: 'cleaning' as NavView, label: 'Cleaning', icon: Sparkles, enabled: hasDataset },
    { id: 'analysis' as NavView, label: 'Analysis', icon: BarChart3, enabled: hasDataset },
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard, enabled: hasAnalyzed },
    { id: 'why' as NavView, label: 'Why? Engine', icon: GitFork, enabled: hasAnalyzed },
    { id: 'insights' as NavView, label: 'Insights', icon: Lightbulb, enabled: hasAnalyzed },
    { id: 'export' as NavView, label: 'Export', icon: DownloadCloud, enabled: hasAnalyzed },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Logo */}
        <div className="p-6 flex items-center justify-between border-b border-[#172e27]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xs">
              <BarChart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg tracking-tight">DataSense AI</span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase">
                Multi-Agent Runtime
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isEnabled = item.enabled;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isEnabled) {
                    onNavigate(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }
                }}
                disabled={!isEnabled}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#183a30] text-white font-semibold shadow-xs border border-emerald-500/20'
                    : isEnabled
                    ? 'text-slate-400 hover:text-white hover:bg-[#122420]'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : isEnabled ? 'text-slate-400' : 'text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-4 border-t border-[#172e27]">
        <div className="p-3 rounded-xl bg-[#122420] border border-[#1b3831] text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">Autonomous Mode</p>
          <p className="text-[10px] text-slate-400 mt-0.5">8 AI Agents Active & Fact-Checked</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0c1815] text-slate-300 flex-col shrink-0 border-r border-[#172e27] min-h-[100dvh]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <aside 
            className="w-72 max-w-[85vw] bg-[#0c1815] text-slate-300 flex flex-col h-full shadow-2xl border-r border-[#172e27] animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
