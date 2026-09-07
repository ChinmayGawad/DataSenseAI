'use client';

import React from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Presentation, Image as ImageIcon, Braces, Sparkles } from 'lucide-react';

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
  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
          : 'border-slate-300 hover:border-emerald-500/70 bg-white/70 hover:bg-emerald-50/20'
      } shadow-sm backdrop-blur-xs`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.xlsx,.xls,.json,.jsonl,.txt,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.tiff"
        onChange={onFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 max-w-lg">
          <p className="text-base font-bold text-slate-900">
            Drag & drop any business document or{' '}
            <span className="text-emerald-700 underline decoration-emerald-400 font-extrabold">
              browse files
            </span>
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Universal Ingestion Engine converts PDFs, Scans, Word Docs, Spreadsheets, and Images into structured data with uncertainty confidence scoring.
          </p>
        </div>

        {/* Universal Format Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            PDF (Digital & Scanned)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel / CSV
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Word (.docx)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <Presentation className="w-3.5 h-3.5 text-amber-600" />
            PowerPoint (.pptx)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
            Image OCR / Handwriting
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <Braces className="w-3.5 h-3.5 text-cyan-600" />
            JSON & Logs
          </span>
        </div>
      </div>
    </div>
  );
}
