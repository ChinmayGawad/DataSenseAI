'use client';

import React from 'react';
import { FileSpreadsheet, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const fileSize = dataset ? formatFileSize(dataset.file_size_bytes) : file ? formatFileSize(file.size) : '2.4 MB';
  const rowCount = dataset ? `${dataset.row_count.toLocaleString()} rows` : '5,320 rows';
  const colCount = dataset ? `${dataset.column_count} columns` : '18 columns';

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{fileName}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{fileSize}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{rowCount}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{colCount}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartAnalysis}
        disabled={isUploading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {isUploading ? (
          <span>Uploading dataset...</span>
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
