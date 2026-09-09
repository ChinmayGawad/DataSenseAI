'use client';

import React, { useEffect } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ChevronRight,
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
  isExpanded: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  hasDataset,
  hasAnalyzed,
  isExpanded,
  onToggle,
  onClose,
}: SidebarProps) {
  // Close expanded sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onClose]);

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

  return (
    <>
      {/* Mobile Backdrop overlay when expanded on small screens */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onClose || onToggle}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar: transitions between w-[72px] (collapsed icon rail) and w-64 (expanded) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-[100dvh] bg-[#0c1815] text-slate-300 border-r border-[#172e27] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out select-none shadow-2xl md:shadow-none ${
          isExpanded ? 'w-64' : 'w-[72px]'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Top Brand Header & Collapse Toggle */}
          <div className="h-16 px-4 border-b border-[#172e27] flex items-center justify-between">
            {isExpanded ? (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/30 shrink-0">
                  <BarChart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0 flex-1 truncate">
                  <span className="font-extrabold text-white text-base tracking-tight truncate">
                    DataSense AI
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase truncate">
                    Multi-Agent Runtime
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                <div
                  onClick={onToggle}
                  className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 transition-colors"
                  title="Expand Menu"
                >
                  <BarChart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Toggle Expand / Collapse Icon Button */}
            {isExpanded && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items (Icons always visible; Labels visible when expanded) */}
          <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isEnabled = item.enabled;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => {
                      if (isEnabled) {
                        onNavigate(item.id);
                        if (window.innerWidth < 768 && onClose) {
                          onClose();
                        }
                      }
                    }}
                    disabled={!isEnabled}
                    className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                      isExpanded
                        ? 'gap-3 px-3.5 py-2.5 text-xs font-medium justify-start'
                        : 'justify-center p-2.5 h-11'
                    } ${
                      isActive
                        ? 'bg-[#183a30] text-white font-bold shadow-xs border border-emerald-500/30'
                        : isEnabled
                        ? 'text-slate-300 hover:text-white hover:bg-[#122420]'
                        : 'text-slate-600 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-emerald-400'
                          : isEnabled
                          ? 'text-slate-400 group-hover:text-emerald-400'
                          : 'text-slate-600'
                      }`}
                    />

                    {isExpanded && (
                      <span className="text-sm truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}

                    {isExpanded && isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shrink-0" />
                    )}

                    {!isExpanded && isActive && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-400" />
                    )}
                  </button>

                  {/* Floating Tooltip when Sidebar is Collapsed (Closed) */}
                  {!isExpanded && (
                    <div className="hidden group-hover:flex items-center absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#08120f] text-white text-xs font-semibold rounded-xl whitespace-nowrap z-50 shadow-xl border border-[#1b3831] pointer-events-none animate-in fade-in duration-150">
                      <span>{item.label}</span>
                      {!isEnabled && (
                        <span className="ml-1.5 text-[10px] text-amber-400 font-normal">
                          (Pending analysis)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Expand Toggle Button when collapsed */}
          {!isExpanded && (
            <div className="p-3 border-t border-[#172e27] flex justify-center">
              <button
                onClick={onToggle}
                className="w-10 h-10 rounded-xl bg-[#122420] hover:bg-[#183a30] border border-[#1b3831] text-emerald-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Bottom Footer Details when Expanded */}
          {isExpanded && (
            <div className="p-4 border-t border-[#172e27] space-y-3">
              <div className="p-3 rounded-2xl bg-[#122420] border border-[#1b3831] text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Autonomous Mode</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  8 AI Agents Active & Fact-Checked
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
