'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Table, Upload } from 'lucide-react';
import { ColumnProfileItem, DashboardResponse, DatasetUploadResponse } from '../../lib/api';
import ColumnCatalogFilters from '../presentation/profile/ColumnCatalogFilters';
import ColumnCatalogTable from '../presentation/profile/ColumnCatalogTable';
import ColumnTypeSummaryPills from '../presentation/profile/ColumnTypeSummaryPills';
import InteractiveDataGridModal from '../presentation/profile/InteractiveDataGridModal';

interface DataProfileViewProps {
  dashboard: DashboardResponse | null;
  uploadedDataset?: DatasetUploadResponse | null;
  onProceedToCleaning?: () => void;
}

export default function DataProfileView({
  dashboard,
  uploadedDataset,
  onProceedToCleaning,
}: DataProfileViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);

  // Resolve columns: prefer fully-analysed dashboard.columns, then fall back
  // to the fast-profile returned immediately on upload. Never use hard-coded stubs.
  const rawColumns: ColumnProfileItem[] =
    (dashboard?.columns && dashboard.columns.length > 0)
      ? dashboard.columns
      : (uploadedDataset?.columns && uploadedDataset.columns.length > 0)
        ? uploadedDataset.columns
        : [];

  const datasetName =
    dashboard?.dataset_name ||
    uploadedDataset?.filename ||
    'Uploaded Dataset';

  const totalRows =
    dashboard?.quality_report?.total_rows ??
    uploadedDataset?.row_count ??
    0;

  const columnCount = rawColumns.length || uploadedDataset?.column_count || 0;

  const filteredColumns = rawColumns.filter((col) => {
    const matchesSearch = col.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      col.detected_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const typeCounts = rawColumns.reduce<Record<string, number>>((acc, col) => {
    const t = col.detected_type.toLowerCase();
    if (t.includes('num') || t.includes('int') || t.includes('float')) {
      acc['numeric'] = (acc['numeric'] || 0) + 1;
    } else if (t.includes('cat') || t.includes('str') || t.includes('id') || t.includes('identifier')) {
      acc['categorical'] = (acc['categorical'] || 0) + 1;
    } else if (t.includes('date') || t.includes('time')) {
      acc['date'] = (acc['date'] || 0) + 1;
    } else {
      acc['text'] = (acc['text'] || 0) + 1;
    }
    return acc;
  }, {});

  // Raw sample rows: from dashboard preview, upload sample, or empty
  const rawRows =
    (dashboard as any)?.raw_rows ??
    uploadedDataset?.sample_rows ??
    [];

  const hasData = rawColumns.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Autonomous Schema Discovery
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dataset Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {hasData
              ? `${datasetName} • ${columnCount} detected columns • ${totalRows.toLocaleString()} rows`
              : 'Upload a dataset to inspect its column schema and data types.'}
          </p>
        </div>

        {hasData && (
          <button
            onClick={() => setIsRawDataOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Table className="w-4 h-4 text-emerald-600" />
            <span>View Raw Data</span>
          </button>
        )}
      </div>

      {!hasData ? (
        /* Empty state: no upload yet OR analysis hasn't produced columns */
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <Upload className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Dataset Loaded</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Upload a data file (CSV, Excel, PDF, Word, JSON, Image) to see its
            column schema, detected types, null rates, and sample values here.
          </p>
        </div>
      ) : (
        <>
          {/* Presentation Module 1: Filters */}
          <ColumnCatalogFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
          />

          {/* Presentation Module 2: Column Table */}
          <ColumnCatalogTable columns={filteredColumns} />

          {/* Bottom Row: Type Summary Pills + Continue CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <ColumnTypeSummaryPills
              numericCount={typeCounts['numeric'] || 0}
              categoricalCount={typeCounts['categorical'] || 0}
              dateCount={typeCounts['date'] || 0}
              textCount={typeCounts['text'] || 0}
            />

            {onProceedToCleaning && (
              <button
                onClick={onProceedToCleaning}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer ml-auto"
              >
                <span>Continue to Cleaning Report</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </>
      )}

      {/* Interactive Data Grid Modal */}
      <InteractiveDataGridModal
        isOpen={isRawDataOpen}
        onClose={() => setIsRawDataOpen(false)}
        datasetName={datasetName}
        rawRows={dashboard?.raw_rows || rawRows}
        cleanedRows={dashboard?.cleaned_rows || rawRows}
        cleaningDiffs={dashboard?.cleaning_diffs || []}
        totalRows={totalRows}
        initialMode="raw"
      />
    </div>
  );
}
