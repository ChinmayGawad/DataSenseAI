'use client';

import React from 'react';
import {
  ArrowRight,
  BarChart,
  LineChart,
  PieChart,
  Brain,
  Sparkles,
  CheckCircle2,
  Table,
  Eye,
  Zap,
} from 'lucide-react';

interface LandingViewProps {
  onStartUpload: () => void;
}

export default function LandingView({ onStartUpload }: LandingViewProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f5f8f7]">
      {/* Top Navigation */}
      <nav className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <BarChart className="w-5 h-5 fill-emerald-600 text-emerald-600" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">DataSense AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
          <span className="hover:text-slate-900 cursor-pointer">Home</span>
          <span className="hover:text-slate-900 cursor-pointer">Features</span>
          <span className="hover:text-slate-900 cursor-pointer">How It Works</span>
          <span className="hover:text-slate-900 cursor-pointer">Use Cases</span>
        </div>

        <button
          onClick={onStartUpload}
          className="px-5 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#152e28] text-white text-xs font-medium transition-colors shadow-xs active:scale-[0.98]"
        >
          Get Started
        </button>
      </nav>

      {/* Main Hero */}
      <main className="max-w-7xl w-full mx-auto px-6 flex-1 flex flex-col justify-center py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Value Prop */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              From <br />
              <span className="text-slate-900">Raw Data</span> <br />
              <span className="text-emerald-700">to Real Insights</span>
            </h1>

            <p className="text-slate-600 text-base max-w-md leading-relaxed">
              Upload any spreadsheet and let AI automatically clean, analyse, visualise and explain your data — no technical skills required.
            </p>

            <div>
              <button
                onClick={onStartUpload}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#152e28] text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98] group"
              >
                <span>Upload Your Dataset</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Reference Visual Illustration */}
          <div className="relative flex items-center justify-center">
            {/* Mint Gradient Glow Backdrop */}
            <div className="absolute w-80 h-80 rounded-full bg-emerald-200/50 blur-3xl -z-10" />

            {/* Spreadsheets & Charts Card Stack */}
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-xs font-bold text-slate-700 ml-2">Your Data</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  AI Analysis
                </div>
              </div>

              {/* Graphic Mockup Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-28">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Sales Trend</span>
                  <div className="flex items-end gap-1.5 h-12">
                    <div className="w-3 h-4 bg-emerald-300 rounded-xs" />
                    <div className="w-3 h-7 bg-emerald-400 rounded-xs" />
                    <div className="w-3 h-6 bg-emerald-500 rounded-xs" />
                    <div className="w-3 h-10 bg-emerald-600 rounded-xs" />
                    <div className="w-3 h-12 bg-emerald-700 rounded-xs" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-28">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Distribution</span>
                  <div className="flex items-center justify-center h-12">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-emerald-300 border-r-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Cleaned 24 duplicates & missing values
                </span>
                <span className="font-bold text-emerald-700">98% Health</span>
              </div>

              {/* Handwritten Note Annotation */}
              <div className="absolute -bottom-7 -right-4 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-200 shadow-md rotate-[-6deg] text-xs font-serif italic text-emerald-800 flex items-center gap-1">
                <span>Same data. Smarter decisions.</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Badges at Bottom */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-20 border-t border-slate-200/80 mt-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
              <Table className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Automatic</h4>
              <p className="text-[11px] text-slate-500">Data Understanding</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
              <Brain className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">AI-Powered</h4>
              <p className="text-[11px] text-slate-500">Analysis & ML</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
              <BarChart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Beautiful</h4>
              <p className="text-[11px] text-slate-500">Visualisations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Plain-Language</h4>
              <p className="text-[11px] text-slate-500">Fact-Checked Insights</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
