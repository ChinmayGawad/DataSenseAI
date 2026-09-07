'use client';

import React from 'react';
import { UploadCloud } from 'lucide-react';

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
      className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
          : 'border-slate-300 hover:border-emerald-500/70 bg-white/70 hover:bg-emerald-50/20'
      } shadow-sm backdrop-blur-xs`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={onFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">
            Drag & Drop your file here, or{' '}
            <span className="text-emerald-700 underline decoration-emerald-400 font-bold">
              Choose File
            </span>
          </p>
          <p className="text-xs text-slate-400">
            Supports CSV, XLSX, XLS up to 50MB (automatic delimiter & encoding detection)
          </p>
        </div>
      </div>
    </div>
  );
}
