'use client';

import React from 'react';

interface CircularProgressProps {
  progress?: number;
  percentage?: number;
  size?: number;
  strokeWidth?: number;
  subtitle?: string;
}

export default function CircularProgress({
  progress,
  percentage,
  size = 180,
  strokeWidth = 14,
  subtitle = "Almost there!\nGood things take a little time.",
}: CircularProgressProps) {
  const actualVal = percentage ?? progress ?? 60;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, actualVal));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transition-all duration-500 ease-out"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {clampedProgress}%
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 text-center mt-3 max-w-[160px] leading-relaxed whitespace-pre-line font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
