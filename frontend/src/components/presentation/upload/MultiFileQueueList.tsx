'use client';

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Braces,
  Archive,
  File as FileGeneric,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { FileMetadataItem } from '../../../lib/api';

interface MultiFileQueueListProps {
  files?: FileMetadataItem[];
  localFiles?: File[];
  totalFilesCount?: number;
  onClear?: () => void;
}

export default function MultiFileQueueList({
  files = [],
  localFiles = [],
  totalFilesCount = 0,
  onClear,
}: MultiFileQueueListProps) {
  const getFileIcon = (filename: string, fileType?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['csv', 'xlsx', 'xls', 'tsv', 'parquet'].includes(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (['pdf', 'docx', 'doc', 'txt', 'md'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    if (['pptx', 'ppt'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-amber-600" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-purple-600" />;
    }
    if (['json', 'jsonl', 'xml'].includes(ext)) {
      return <Braces className="w-4 h-4 text-cyan-600" />;
    }
    if (['zip', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-4 h-4 text-amber-700" />;
    }
    return <FileGeneric className="w-4 h-4 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Combine metadata items or fallback to local files
  const displayItems =
    files.length > 0
      ? files
      : localFiles.map((f) => ({
          filename: f.name,
          file_type: f.name.split('.').pop() || '',
          file_size_bytes: f.size,
          row_count: 0,
          column_count: 0,
          extraction_confidence: 100.0,
          has_handwritten_content: false,
        }));

  if (displayItems.length <= 1) return null;

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Ingested Document Bundle ({displayItems.length} Files)
            </h4>
            <p className="text-[10px] text-slate-400">
              Cross-document tables stitched and normalized into unified intermediate representation
            </p>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Grid of File Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                {getFileIcon(item.filename, item.file_type)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate" title={item.filename}>
                  {item.filename}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{formatFileSize(item.file_size_bytes)}</span>
                  <span>•</span>
                  <span className="uppercase text-emerald-700 font-semibold">{item.file_type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-600 shrink-0 pl-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
