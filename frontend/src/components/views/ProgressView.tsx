'use client';

import React from 'react';
import { Sparkles, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import CircularProgress from '../ui/CircularProgress';
import ProgressChecklist from '../presentation/progress/ProgressChecklist';
import ProgressTipCard from '../presentation/progress/ProgressTipCard';
import { JobStatusResponse } from '../../lib/api';

interface ProgressViewProps {
  jobStatus: JobStatusResponse | null;
  onViewDashboard?: () => void;
  onRetry?: () => void;
}

export default function ProgressView({ jobStatus, onViewDashboard, onRetry }: ProgressViewProps) {
  if (jobStatus?.status === 'failed') {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Investigation Interrupted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {jobStatus.error_message || 'The autonomous pipeline encountered an unrecoverable error during data processing.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Another Dataset</span>
          </button>
        )}
      </div>
    );
  }

  const currentProgress = jobStatus ? Math.min(Math.max(jobStatus.progress_percentage, 5), 100) : 60;
  const isCompleted = jobStatus?.status === 'completed' || currentProgress >= 100;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          Autonomous Multi-Agent Investigation
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isCompleted ? 'Analysis Complete!' : 'Analyzing Your Dataset...'}
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          {isCompleted
            ? 'Your dataset has been cleaned, profiled, and verified by 8 specialized AI agents.'
            : 'Please wait while our autonomous agents clean, profile, and synthesize verified insights from your data.'}
        </p>
      </div>

      {/* Main Grid: Checklist on Left, Circular Progress on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Presentation Module 1: 8-Step Checklist */}
        <div className="md:col-span-7">
          <ProgressChecklist currentProgress={currentProgress} />
        </div>

        {/* Presentation Module 2: Circular Progress Gauge & Tip */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col items-center text-center space-y-6">
            <CircularProgress
              percentage={currentProgress}
              size={170}
              strokeWidth={13}
            />

            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">
                {isCompleted ? 'Ready to explore!' : 'Almost there!'}
              </h4>
              <p className="text-xs text-slate-500">
                {isCompleted
                  ? 'Click below to review your self-designing dashboard.'
                  : 'Good things take a little time. Deep statistical analysis in progress.'}
              </p>
            </div>

            {isCompleted && onViewDashboard && (
              <button
                onClick={onViewDashboard}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>

          {/* Presentation Module 3: Tip Card */}
          <ProgressTipCard />
        </div>
      </div>
    </div>
  );
}
