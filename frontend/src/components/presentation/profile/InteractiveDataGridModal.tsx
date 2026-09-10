'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CleaningDiffItem } from '../../../lib/api';

export type DataGridMode = 'diff' | 'cleaned' | 'raw';

interface InteractiveDataGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName?: string;
  rawRows?: Record<string, any>[];
  cleanedRows?: Record<string, any>[];
  cleaningDiffs?: CleaningDiffItem[];
  totalRows?: number;
  initialMode?: DataGridMode;
}

export default function InteractiveDataGridModal({
  isOpen,
  onClose,
  datasetName = 'Active Dataset',
  rawRows = [],
  cleanedRows = [],
  cleaningDiffs = [],
  totalRows,
  initialMode = 'diff',
}: InteractiveDataGridModalProps) {
  const [mode, setMode] = useState<DataGridMode>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Sync initialMode when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCurrentPage(1);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Fallback data if no rows provided
  const effectiveRawRows = useMemo(() => {
    if (rawRows && rawRows.length > 0) return rawRows;
    // Mock data fallback with deliberate nulls
    return [
      { Order_Date: '2024-01-15', Region: 'West', Category: 'Technology', Sales: 24500, Profit: 5400, Discount: null, Customer_ID: 'CUST-101' },
      { Order_Date: '2024-01-16', Region: null, Category: 'Furniture', Sales: 8900, Profit: 1200, Discount: 0.1, Customer_ID: 'CUST-102' },
      { Order_Date: '2024-01-18', Region: 'East', Category: 'Office Supplies', Sales: null, Profit: 650, Discount: 0.0, Customer_ID: 'CUST-103' },
      { Order_Date: '2024-01-20', Region: 'West', Category: 'Technology', Sales: 54000, Profit: 12800, Discount: 0.05, Customer_ID: 'CUST-104' },
      { Order_Date: '2024-01-22', Region: 'South', Category: null, Sales: 14200, Profit: -1400, Discount: 0.25, Customer_ID: 'CUST-105' },
    ];
  }, [rawRows]);

  const effectiveCleanedRows = useMemo(() => {
    if (cleanedRows && cleanedRows.length > 0) return cleanedRows;
    // Fallback cleaned version
    return [
      { Order_Date: '2024-01-15', Region: 'West', Category: 'Technology', Sales: 24500, Profit: 5400, Discount: 0.05, Customer_ID: 'CUST-101' },
      { Order_Date: '2024-01-16', Region: 'West', Category: 'Furniture', Sales: 8900, Profit: 1200, Discount: 0.1, Customer_ID: 'CUST-102' },
      { Order_Date: '2024-01-18', Region: 'East', Category: 'Office Supplies', Sales: 18450, Profit: 650, Discount: 0.0, Customer_ID: 'CUST-103' },
      { Order_Date: '2024-01-20', Region: 'West', Category: 'Technology', Sales: 54000, Profit: 12800, Discount: 0.05, Customer_ID: 'CUST-104' },
      { Order_Date: '2024-01-22', Region: 'South', Category: 'Office Supplies', Sales: 14200, Profit: -1400, Discount: 0.25, Customer_ID: 'CUST-105' },
    ];
  }, [cleanedRows]);

  // Index diffs by `${row_index}_${column}` for O(1) cell lookup
  const diffLookup = useMemo(() => {
    const map = new Map<string, CleaningDiffItem>();
    cleaningDiffs.forEach((diff) => {
      map.set(`${diff.row_index}_${diff.column}`, diff);
    });
    return map;
  }, [cleaningDiffs]);

  // Set of modified row indices
  const modifiedRowIndices = useMemo(() => {
    const set = new Set<number>();
    cleaningDiffs.forEach((d) => set.add(d.row_index));
    // Also detect implicit diffs if diffLookup was empty but raw and cleaned differ
    if (set.size === 0 && effectiveRawRows.length > 0 && effectiveCleanedRows.length > 0) {
      const len = Math.min(effectiveRawRows.length, effectiveCleanedRows.length);
      for (let i = 0; i < len; i++) {
        const raw = effectiveRawRows[i];
        const clean = effectiveCleanedRows[i];
        for (const k of Object.keys(raw)) {
          if (raw[k] === null || raw[k] === undefined || raw[k] === '' || raw[k] !== clean[k]) {
            set.add(i);
            break;
          }
        }
      }
    }
    return set;
  }, [cleaningDiffs, effectiveRawRows, effectiveCleanedRows]);

  // Derive column headers
  const columns = useMemo(() => {
    const source = effectiveCleanedRows.length > 0 ? effectiveCleanedRows[0] : effectiveRawRows[0];
    if (!source) return [];
    return Object.keys(source).filter((k) => k !== '#');
  }, [effectiveCleanedRows, effectiveRawRows]);

  // Active dataset depending on selected view mode
  const baseRows = useMemo(() => {
    if (mode === 'raw') return effectiveRawRows;
    return effectiveCleanedRows;
  }, [mode, effectiveRawRows, effectiveCleanedRows]);

  // Filtered & Sorted Rows
  type GridRow = Record<string, any> & {
    __original_idx: number;
    __is_modified: boolean;
  };

  const processedRows = useMemo(() => {
    let list: GridRow[] = baseRows.map((row, originalIndex) => ({
      ...row,
      __original_idx: originalIndex,
      __is_modified: modifiedRowIndices.has(originalIndex),
    }));

    // Filter modified only
    if (showModifiedOnly) {
      list = list.filter((r) => r.__is_modified);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((r) => {
        if (selectedColumn !== 'all') {
          const val = (r as Record<string, any>)[selectedColumn];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        }
        return columns.some((col) => {
          const val = (r as Record<string, any>)[col];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      });
    }

    // Sort
    if (sortColumn) {
      list.sort((a, b) => {
        const aVal = (a as Record<string, any>)[sortColumn];
        const bVal = (b as Record<string, any>)[sortColumn];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [baseRows, showModifiedOnly, searchQuery, selectedColumn, sortColumn, sortDirection, columns, modifiedRowIndices]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Export CSV handler
  const handleExportCsv = () => {
    if (processedRows.length === 0) return;
    const headerLine = columns.join(',');
    const rowsLines = processedRows.map((r) =>
      columns
        .map((col) => {
          const val = (r as Record<string, any>)[col];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
    const csvContent = [headerLine, ...rowsLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${datasetName.replace(/\.[^/.]+$/, '')}_${mode}_view.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{datasetName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  {totalRows ?? effectiveCleanedRows.length} Rows
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-600">
                  {columns.length} Columns
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Interactive Multi-Agent Data Grid with Autonomous Remediation Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Download currently filtered rows as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export View</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 self-start">
            <button
              onClick={() => {
                setMode('diff');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'diff'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Raw vs Cleaned Diff</span>
              {modifiedRowIndices.size > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {modifiedRowIndices.size}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setMode('cleaned');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'cleaned'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Cleaned Data</span>
            </button>

            <button
              onClick={() => {
                setMode('raw');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Raw Original</span>
            </button>
          </div>

          {/* Search, Column Selector & Modified Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Modified Only Toggle */}
            <button
              onClick={() => {
                setShowModifiedOnly(!showModifiedOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showModifiedOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modified Rows Only</span>
            </button>

            {/* Column Filter Dropdown */}
            <select
              value={selectedColumn}
              onChange={(e) => {
                setSelectedColumn(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Columns</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search cell values..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DIFF BANNER / LEGEND */}
        {mode === 'diff' && (
          <div className="px-6 py-2 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Diff Legend:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Imputed / Formatted Value (Hover for Rationale)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100/70 border border-amber-200 text-amber-800 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                Original Null Cell
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Showing side-by-side remediation comparison
            </span>
          </div>
        )}

        {/* DATA GRID TABLE */}
        <div className="flex-1 overflow-auto bg-slate-50/30">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-semibold shadow-2xs">
              <tr>
                <th className="py-3 px-3 w-12 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200/60">
                  #
                </th>
                {columns.map((col) => {
                  const isSorted = sortColumn === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-3 px-4 select-none hover:bg-slate-200/70 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="tracking-tight text-slate-800">{col}</span>
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-mono">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center text-slate-400 font-sans">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-600">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const originalIdx = row.__original_idx;
                  const isRowModified = row.__is_modified;
                  const rawRow = effectiveRawRows[originalIdx] || {};
                  const cleanRow = effectiveCleanedRows[originalIdx] || {};

                  return (
                    <tr
                      key={originalIdx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isRowModified && mode === 'diff' ? 'bg-emerald-50/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100 select-none">
                        {originalIdx + 1}
                      </td>

                      {columns.map((col) => {
                        const rawVal = rawRow[col];
                        const cleanVal = cleanRow[col];
                        const isDiff =
                          mode === 'diff' &&
                          (diffLookup.has(`${originalIdx}_${col}`) ||
                            rawVal === null ||
                            rawVal === undefined ||
                            rawVal === '' ||
                            String(rawVal) !== String(cleanVal));

                        const diffItem = diffLookup.get(`${originalIdx}_${col}`);

                        // Value to render
                        let displayValue: any;
                        if (mode === 'raw') {
                          displayValue = rawVal;
                        } else {
                          displayValue = cleanVal;
                        }

                        const isNull = displayValue === null || displayValue === undefined || displayValue === '';

                        return (
                          <td key={col} className="py-2.5 px-4 text-slate-700 whitespace-nowrap relative group">
                            {isDiff ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-medium">
                                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{displayValue ?? 'None'}</span>

                                {/* Tooltip explaining the exact rationale */}
                                <div className="absolute left-4 bottom-full mb-1 z-30 hidden group-hover:flex flex-col p-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-sans shadow-xl w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                                    <span>Remediation Action</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/60 border border-emerald-700">
                                      {diffItem?.action_type || 'Imputed'}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 text-[10px] space-y-0.5 mb-1.5">
                                    <div>
                                      Original:{' '}
                                      <span className="text-amber-300 font-mono">
                                        {rawVal === null || rawVal === undefined ? 'null' : String(rawVal)}
                                      </span>
                                    </div>
                                    <div>
                                      Remediated:{' '}
                                      <span className="text-emerald-300 font-mono">{String(cleanVal)}</span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                                    {diffItem?.reason ||
                                      'Statistical imputation applied to preserve record distribution.'}
                                  </p>
                                </div>
                              </div>
                            ) : isNull ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-sans text-[11px] font-medium">
                                null
                              </span>
                            ) : (
                              <span>{String(displayValue)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER WITH PAGINATION */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-slate-800">
                {processedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, processedRows.length)}
              </strong>{' '}
              of <strong className="text-slate-800">{processedRows.length}</strong> records
              {processedRows.length !== baseRows.length && ` (filtered from ${baseRows.length})`}
            </span>

            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
