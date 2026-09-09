'use client';

import React from 'react';
import { Sparkles, AlertCircle, FileCheck, Layers } from 'lucide-react';
import { DatasetUploadResponse } from '../../lib/api';
import DropzoneCard from '../presentation/upload/DropzoneCard';
import FilePreviewBadge from '../presentation/upload/FilePreviewBadge';
import MultiFileQueueList from '../presentation/upload/MultiFileQueueList';
import DocumentExtractionSummary from '../presentation/upload/DocumentExtractionSummary';
import SampleBenchmarksRow from '../presentation/upload/SampleBenchmarksRow';

interface UploadViewProps {
  onFileUpload: (fileOrFiles: File | File[]) => Promise<any>;
  onStartAnalysis: () => void;
  uploadedDataset: DatasetUploadResponse | null;
  isUploading: boolean;
  onSelectSample: (sampleType: 'retail' | 'marketing' | 'healthcare') => void;
}

export default function UploadView({
  onFileUpload,
  onStartAnalysis,
  uploadedDataset,
  isUploading,
  onSelectSample,
}: UploadViewProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [localFiles, setLocalFiles] = React.useState<File[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setLocalFiles(files);
      try {
        await onFileUpload(files.length === 1 ? files[0] : files);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to process files');
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setLocalFiles(files);
      try {
        await onFileUpload(files.length === 1 ? files[0] : files);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to process files');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Universal 20+ Format Ingestion Pipeline</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Single or Multiple Documents
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Support for Spreadsheets, PDFs (Digital & Scanned), Word, PPTX, Images, Handwritten Forms, JSON & ZIP bundles.
        </p>
      </div>

      {/* Presentation Module 1: Dropzone */}
      <DropzoneCard
        isDragging={isDragging}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        onFileInput={handleFileInput}
      />

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Multi-File Ingested Queue */}
      {uploadedDataset && (uploadedDataset.total_files_count || 1) > 1 && (
        <MultiFileQueueList
          files={uploadedDataset.files_summary}
          localFiles={localFiles}
          totalFilesCount={uploadedDataset.total_files_count}
        />
      )}

      {/* Presentation Module 2: Document Extraction Summary (When non-spreadsheet or uncertainty exists) */}
      {uploadedDataset &&
        ((uploadedDataset.uncertain_fields_count || 0) > 0 ||
          uploadedDataset.file_type !== 'spreadsheet' ||
          (uploadedDataset.total_files_count || 1) > 1) && (
          <DocumentExtractionSummary dataset={uploadedDataset} />
        )}

      {/* Presentation Module 3: File Preview Badge & Analysis Trigger */}
      <FilePreviewBadge
        dataset={uploadedDataset}
        file={localFiles[0] || null}
        onStartAnalysis={onStartAnalysis}
        isUploading={isUploading}
      />

      {/* Presentation Module 4: Benchmark Samples */}
      <SampleBenchmarksRow onSelectSample={onSelectSample} />
    </div>
  );
}
