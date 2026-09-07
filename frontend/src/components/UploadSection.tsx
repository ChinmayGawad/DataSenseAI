'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { uploadDataset, startInvestigation } from '../lib/api';

interface UploadSectionProps {
  onInvestigationStarted: (jobId: string, filename: string) => void;
}

export default function UploadSection({ onInvestigationStarted }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // 1. Upload to backend
      const uploadRes = await uploadDataset(file);
      // 2. Trigger multi-agent pipeline
      const investRes = await startInvestigation(uploadRes.dataset_id);
      // 3. Notify parent component
      onInvestigationStarted(investRes.job_id, file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to process dataset. Ensure backend is running.');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSampleLoad = async (sampleName: string, path: string) => {
    setError(null);
    setUploading(true);
    try {
      // Fetch sample CSV from datasets endpoint or static file
      const res = await fetch(`/api/sample?name=${sampleName}`).catch(() => null);
      
      // If sample route not mounted, load via backend upload using synthetic blob
      let csvContent = "";
      if (sampleName === 'retail') {
        csvContent = `Order_ID,Order_Date,Region,Product_Category,Sales,Profit,Discount,Quantity\nORD-1001,2024-01-15,North,Electronics,1200.50,340.20,0.05,4\nORD-1002,2024-01-16,South,Furniture,850.00,120.00,0.10,2\nORD-1003,2024-01-17,East,Office Supplies,45.20,15.10,0.00,5\nORD-1004,2024-01-18,West,Electronics,2400.00,720.00,0.15,3\nORD-1005,2024-01-19,North,Furniture,650.00,80.00,0.20,1\nORD-1006,2024-01-20,East,Electronics,1800.00,510.00,0.05,2\nORD-1007,2024-01-21,West,Office Supplies,120.00,45.00,0.00,10\nORD-1008,2024-01-22,South,Electronics,3100.00,950.00,0.10,5\nORD-1009,2024-01-23,North,Office Supplies,85.00,28.00,0.00,4\nORD-1010,2024-01-24,East,Furniture,1450.00,210.00,0.15,3\nORD-1011,2024-01-25,West,Electronics,950.00,280.00,0.05,2\nORD-1012,2024-01-26,South,Office Supplies,210.00,65.00,0.00,8\nORD-1013,2024-01-27,North,Furniture,780.00,95.00,0.10,2\nORD-1014,2024-01-28,East,Electronics,4200.00,1350.00,0.20,6\nORD-1015,2024-01-29,West,Furniture,1100.00,160.00,0.15,4\nORD-1016,2024-01-30,South,Electronics,1600.00,480.00,0.05,3\nORD-1017,2024-01-31,North,Electronics,2900.00,890.00,0.10,5\nORD-1018,2024-02-01,East,Office Supplies,65.00,22.00,0.00,3\nORD-1019,2024-02-02,West,Furniture,1350.00,190.00,0.10,3\nORD-1020,2024-02-03,South,Electronics,2200.00,660.00,0.05,4\nORD-1020,2024-02-03,South,Electronics,2200.00,660.00,0.05,4\nORD-1021,2024-02-04,North,Electronics,15000.00,4200.00,0.05,12\nORD-1022,2024-02-05,East,Furniture,,110.00,0.10,2\nORD-1023,2024-02-06,West,Office Supplies,95.00,,0.00,6\nORD-1024,2024-02-07,South,Furniture,920.00,130.00,0.15,3`;
      } else if (sampleName === 'marketing') {
        csvContent = `Campaign_ID,Launch_Date,Channel,Ad_Spend,Impressions,Clicks,Conversions,Revenue\nCMP-01,2024-03-01,Google Search,5000,120000,4500,220,18500\nCMP-02,2024-03-02,Facebook Ads,3500,95000,3100,140,9800\nCMP-03,2024-03-03,Email Newsletter,800,25000,1800,160,11200\nCMP-04,2024-03-04,LinkedIn Ads,4200,60000,1900,95,14200\nCMP-05,2024-03-05,YouTube Video,6500,210000,5200,180,16500\nCMP-06,2024-03-06,TikTok Ads,2800,180000,6100,130,7900\nCMP-07,2024-03-07,Google Search,5500,135000,4900,245,21000\nCMP-08,2024-03-08,Facebook Ads,3200,88000,2900,125,8400\nCMP-09,2024-03-09,Influencer,4000,150000,3800,110,9500\nCMP-10,2024-03-10,Email Newsletter,750,24000,1750,155,10800\nCMP-11,2024-03-11,Google Search,,110000,4100,210,17800\nCMP-12,2024-03-12,LinkedIn Ads,4500,65000,,105,15300\nCMP-13,2024-03-13,TikTok Ads,3100,195000,6800,,8600\nCMP-14,2024-03-14,Google Search,6000,145000,5300,260,23400\nCMP-15,2024-03-15,Facebook Ads,3800,102000,3400,150,10500\nCMP-16,2024-03-16,YouTube Video,7000,225000,5600,195,18200\nCMP-17,2024-03-17,Email Newsletter,900,28000,1950,175,12400\nCMP-18,2024-03-18,LinkedIn Ads,4800,68000,2100,115,16100\nCMP-19,2024-03-19,Google Search,5200,128000,4700,235,20100\nCMP-20,2024-03-20,Facebook Ads,3400,92000,3000,135,9200`;
      } else {
        csvContent = `Patient_ID,Age,Gender,Systolic_BP,Diastolic_BP,Cholesterol,BMI,Glucose,Outcome\nPT-001,45,M,120,80,195,24.5,92,0\nPT-002,54,F,135,88,230,28.1,105,1\nPT-003,39,M,118,78,180,22.4,88,0\nPT-004,62,F,148,92,260,31.2,145,1\nPT-005,58,M,140,90,245,29.8,128,1\nPT-006,29,F,110,72,165,21.0,85,0\nPT-007,71,M,155,95,280,33.5,160,1\nPT-008,48,F,125,82,210,25.6,98,0\nPT-009,52,M,130,85,225,27.3,112,0\nPT-010,36,F,115,75,175,23.1,90,0\nPT-011,67,M,160,100,310,35.0,185,1\nPT-012,43,F,122,80,190,24.0,94,0\nPT-013,85,M,210,120,380,42.0,290,1\nPT-014,31,F,112,74,170,21.8,86,0\nPT-015,59,M,142,91,250,30.1,135,1\nPT-016,50,F,128,84,215,26.5,102,0\nPT-017,64,M,150,94,270,32.0,150,1\nPT-018,41,F,119,79,185,23.7,91,0\nPT-019,56,M,138,89,240,28.9,120,1\nPT-020,33,F,114,76,172,22.0,89,0`;
      }

      const file = new File([csvContent], `${sampleName}_benchmark.csv`, { type: 'text/csv' });
      await handleFileProcess(file);
    } catch (err: any) {
      setError(err.message || 'Error loading sample dataset');
      setUploading(false);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Multi-Agent Investigation Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          AI doesn&apos;t just visualize your data. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400">
            It investigates it.
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          Upload any spreadsheet. A team of 8 specialized AI agents autonomously cleans the data, formulates an investigation plan, runs ML algorithms, and generates a self-designing dashboard with mathematically fact-checked insights.
        </p>
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/5 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5 text-blue-400">
          <UploadCloud className="w-8 h-8" />
        </div>

        {uploading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-white">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Ingesting dataset & booting agent team...
            </div>
            <p className="text-xs text-slate-400">Handing off to Agent 1 (Data Detective)</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-1">
              Drop your spreadsheet here, or <span className="text-blue-400 hover:underline">browse</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Supports CSV, Excel (.xlsx, .xls) up to 50MB. Automatic format and delimiter detection.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Automatic Cleaning
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Zero Hallucination
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                8-Agent Investigation
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-900/20 border border-red-700/50 flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Benchmark Datasets Quick Picker */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or test with verified multi-domain benchmarks:
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSampleLoad('retail', 'datasets/retail_sales.csv')}
            disabled={uploading}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                🛒
              </div>
              <div>
                <p className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                  Retail Sales
                </p>
                <p className="text-[11px] text-slate-400">High variance & outliers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => handleSampleLoad('marketing', 'datasets/marketing_campaign.csv')}
            disabled={uploading}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">
                📈
              </div>
              <div>
                <p className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                  Marketing Campaign
                </p>
                <p className="text-[11px] text-slate-400">Multi-channel conversions</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => handleSampleLoad('healthcare', 'datasets/healthcare_data.csv')}
            disabled={uploading}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-bold">
                🩺
              </div>
              <div>
                <p className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                  Healthcare Biometrics
                </p>
                <p className="text-[11px] text-slate-400">Cluster & anomaly profiling</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </section>
  );
}
