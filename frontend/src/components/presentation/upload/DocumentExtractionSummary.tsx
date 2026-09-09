'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Braces,
  AlertTriangle,
  CheckCircle2,
  Table as TableIcon,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit3,
  Sparkles
} from 'lucide-react';
import { DatasetUploadResponse, UncertainField } from '../../../lib/api';

interface DocumentExtractionSummaryProps {
  dataset: DatasetUploadResponse;
}

export default function DocumentExtractionSummary({ dataset }: DocumentExtractionSummaryProps) {
  const [isUncertaintyExpanded, setIsUncertaintyExpanded] = useState(true);
  const [uncertainValues, setUncertainValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (dataset.uncertain_fields) {
      dataset.uncertain_fields.forEach((u, i) => {
        map[`${u.field}_${i}`] = u.value;
      });
    }
    return map;
  });
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});

  const fileType = dataset.file_type || 'spreadsheet';
  const confidence = dataset.extraction_confidence ?? 100.0;
  const isConfidenceHigh = confidence >= 85.0;
  const uncertainFields = dataset.uncertain_fields || [];
  const tables = dataset.tables_summary || [];

  const handleValueChange = (key: string, val: string) => {
    setUncertainValues((prev) => ({ ...prev, [key]: val }));
  };

  const toggleVerify = (key: string) => {
    setVerifiedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFormatIcon = () => {
    if (fileType.includes('bundle') || (dataset.total_files_count && dataset.total_files_count > 1)) {
      return <Layers className="w-5 h-5 text-emerald-600" />;
    }
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (fileType.includes('word')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('powerpoint')) return <Presentation className="w-5 h-5 text-amber-500" />;
    if (fileType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (fileType.includes('json')) return <Braces className="w-5 h-5 text-cyan-500" />;
    return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  };

  const getFormatLabel = () => {
    if (fileType.includes('bundle') || (dataset.total_files_count && dataset.total_files_count > 1)) {
      return `Unified Document Bundle (${dataset.total_files_count || dataset.files_summary?.length || 2} Ingested Files)`;
    }
    if (fileType === 'pdf_digital') return 'Digital PDF Document (Structured Tables)';
    if (fileType === 'pdf_scanned') return 'Scanned PDF Document (OCR Rasterized)';
    if (fileType === 'word_docx') return 'Microsoft Word Document (.docx)';
    if (fileType === 'powerpoint_pptx') return 'Microsoft PowerPoint Presentation (.pptx)';
    if (fileType === 'image_ocr') return 'Image Document (Layout & Handwriting OCR)';
    if (fileType === 'json') return 'JSON / JSON Lines Document';
    if (fileType === 'text') return 'Plain Text / Markdown Document';
    return 'Spreadsheet Dataset (Excel / CSV)';
  };

  return (
    <div className="space-y-4 rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-sm animate-in fade-in duration-300">
      {/* Top Banner: Ingestion Category & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            {getFormatIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                {getFormatLabel()}
              </h4>
              {dataset.has_handwritten_content && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                  Handwriting Detected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Normalized into Unified Data Representation (UDR) • {dataset.row_count.toLocaleString()} rows × {dataset.column_count} columns
            </p>
          </div>
        </div>

        {/* Extraction Confidence Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Extraction Confidence
            </div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center justify-end gap-1">
              <span className={isConfidenceHigh ? 'text-emerald-700' : 'text-amber-700'}>
                {confidence.toFixed(1)}%
              </span>
              {isConfidenceHigh ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </div>
          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${isConfidenceHigh ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Summary: Pages & Tables Extracted */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pages</span>
          <p className="text-sm font-extrabold text-slate-800">{dataset.total_pages || 1}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tables Extracted</span>
          <p className="text-sm font-extrabold text-slate-800">{dataset.tables_extracted || 1}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analyzable Rows</span>
          <p className="text-sm font-extrabold text-slate-800">{dataset.row_count.toLocaleString()}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uncertain Fields</span>
          <p className={`text-sm font-extrabold ${uncertainFields.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {uncertainFields.length} flagged
          </p>
        </div>
      </div>

      {/* Stitched Tables Breakdown (If multiple tables detected) */}
      {tables.length > 1 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Extracted & Stitched Tables ({tables.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tables.map((tbl, idx) => (
              <div
                key={tbl.table_id || idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <span className="font-bold text-slate-800 truncate block">{tbl.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {tbl.rows} rows • {tbl.cols} cols • Page {tbl.page_range || tbl.page_number}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shrink-0">
                  {tbl.extraction_method}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainty & Handwriting Review Section */}
      {uncertainFields.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsUncertaintyExpanded(!isUncertaintyExpanded)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <h5 className="font-bold text-xs text-amber-900">
                Extraction Uncertainty Review ({uncertainFields.length} field{uncertainFields.length > 1 ? 's' : ''} flagged)
              </h5>
            </div>
            <button className="text-amber-800 hover:text-amber-950 text-xs flex items-center gap-1 font-semibold">
              <span>{isUncertaintyExpanded ? 'Collapse' : 'Review & Verify'}</span>
              {isUncertaintyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-[11px] text-amber-800">
            Values extracted from handwriting or noisy scans have confidence scores below 70%. You can verify or edit them below before investigation.
          </p>

          {isUncertaintyExpanded && (
            <div className="space-y-2 pt-1">
              {uncertainFields.map((field, idx) => {
                const key = `${field.field}_${idx}`;
                const isVerified = verifiedMap[key] || false;

                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-white border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{field.field}:</span>
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {field.value}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          {field.confidence.toFixed(1)}% OCR Confidence
                        </span>
                      </div>
                      {field.warning && (
                        <p className="text-[11px] text-amber-700">{field.warning}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={uncertainValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder="Correct value..."
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 w-32 focus:bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        onClick={() => toggleVerify(key)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isVerified
                            ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                            : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span>{isVerified ? 'Verified' : 'Confirm'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
