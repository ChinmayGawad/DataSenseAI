'use client';

import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  Image as ImageIcon,
  Braces,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { DatasetUploadResponse } from '../../../lib/api';

interface FilePreviewBadgeProps {
  dataset: DatasetUploadResponse | null;
  file: File | null;
  onStartAnalysis: () => void;
  isUploading: boolean;
}

export default function FilePreviewBadge({
  dataset,
  file,
  onStartAnalysis,
  isUploading,
}: FilePreviewBadgeProps) {
  if (!dataset && !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileName = dataset?.filename || file?.name || 'sales_data.xlsx';
  const fileType = dataset?.file_type || 'spreadsheet';
  const fileSize = dataset ? formatFileSize(dataset.file_size_bytes) : file ? formatFileSize(file.size) : '2.4 MB';
  const rowCount = dataset ? `${dataset.row_count.toLocaleString()} rows` : '5,320 rows';
  const colCount = dataset ? `${dataset.column_count} columns` : '18 columns';
  const totalPages = dataset?.total_pages || 1;
  const tablesExtracted = dataset?.tables_extracted || 1;
  const confidence = dataset?.extraction_confidence ?? 100.0;
  const uncertainCount = dataset?.uncertain_fields_count ?? 0;

  const getFormatIcon = () => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-rose-500" />;
    if (fileType.includes('word')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (fileType.includes('powerpoint')) return <Presentation className="w-6 h-6 text-amber-500" />;
    if (fileType.includes('image')) return <ImageIcon className="w-6 h-6 text-purple-500" />;
    if (fileType.includes('json')) return <Braces className="w-6 h-6 text-cyan-500" />;
    return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
          {getFormatIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{fileName}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {uncertainCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {uncertainCount} Uncertain
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{fileSize}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{rowCount}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{colCount}</span>
            {totalPages > 1 && (
              <>
                <span>•</span>
                <span className="font-medium text-slate-700">{totalPages} pages ({tablesExtracted} tables)</span>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {confidence.toFixed(1)}% Confidence
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartAnalysis}
        disabled={isUploading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {isUploading ? (
          <span>Analyzing Dataset...</span>
        ) : (
          <>
            <span>Start Analysis</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </>
        )}
      </button>
    </div>
  );
}
