'use client';

import React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Presentation,
  Image as ImageIcon,
  Braces,
  Archive,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface DropzoneCardProps {
  isDragging: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DropzoneCard({
  isDragging,
  onDrag,
  onDrop,
  onClick,
  fileInputRef,
  onFileInput,
}: DropzoneCardProps) {
  const supportedCategories = [
    {
      title: 'Spreadsheets',
      formats: '.csv, .xlsx, .tsv, .parquet',
      icon: FileSpreadsheet,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'PDFs & Docs',
      formats: '.pdf (digital/scanned), .docx, .pptx',
      icon: FileText,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Images & Handwriting',
      formats: '.png, .jpg, .webp, .tiff, handwritten',
      icon: ImageIcon,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'JSON & Text',
      formats: '.json, .jsonl, .txt, .md',
      icon: Braces,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      title: 'Archive Bundles',
      formats: '.zip, .tar.gz (multi-doc bundles)',
      icon: Archive,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-6 sm:p-10 text-center transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01] ring-4 ring-emerald-500/20'
          : 'border-slate-300 hover:border-emerald-500/70 bg-white/80 hover:bg-emerald-50/20'
      } shadow-sm backdrop-blur-xs`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.tsv,.xlsx,.xls,.xlsm,.parquet,.json,.jsonl,.txt,.md,.log,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.zip,.tar,.gz"
        onChange={onFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Main Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-xs">
          <UploadCloud className="w-8 h-8 animate-pulse" />
        </div>

        {/* Action Title */}
        <div className="space-y-1 text-center">
          <p className="text-base sm:text-xl font-extrabold text-slate-800">
            Drag & Drop single or multiple files here
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Upload heterogeneous business documents, scans, forms, or spreadsheets together
          </p>
        </div>

        {/* Browse Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-6 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          Choose Files (Multi-Select Supported)
        </button>

        {/* Supported Multi-Format Chips Grid */}
        <div className="pt-2 w-full max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Universal 20+ Format Ingestion Engine</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-left">
            {supportedCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-[11px] ${cat.badgeColor} flex flex-col justify-between transition-transform hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.title}</span>
                  </div>
                  <span className="text-[10px] opacity-85 mt-1 truncate">
                    {cat.formats}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-1">
          Max size: <span className="font-semibold text-slate-600">50MB per file</span> • OCR & Handwriting Recognition with Confidence Scoring
        </p>
      </div>
    </div>
  );
}
