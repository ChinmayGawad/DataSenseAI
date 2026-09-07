'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ColumnProfileItem, DashboardResponse } from '../../lib/api';
import ColumnCatalogFilters from '../presentation/profile/ColumnCatalogFilters';
import ColumnCatalogTable from '../presentation/profile/ColumnCatalogTable';
import ColumnTypeSummaryPills from '../presentation/profile/ColumnTypeSummaryPills';

interface DataProfileViewProps {
  dashboard: DashboardResponse | null;
  onProceedToCleaning?: () => void;
}

const SAMPLE_COLUMNS: ColumnProfileItem[] = [
  {
    name: 'Order_Date',
    detected_type: 'Date',
    pandas_dtype: 'datetime64[ns]',
    unique_count: 1420,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: ['2024-01-15', '2024-01-16', '2024-01-18'],
    suggested_role: 'time_index',
  },
  {
    name: 'Region',
    detected_type: 'Categorical',
    pandas_dtype: 'string',
    unique_count: 4,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: ['West', 'East', 'Central', 'South'],
    suggested_role: 'dimension',
  },
  {
    name: 'Category',
    detected_type: 'Categorical',
    pandas_dtype: 'string',
    unique_count: 3,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: ['Technology', 'Furniture', 'Office Supplies'],
    suggested_role: 'dimension',
  },
  {
    name: 'Sub_Category',
    detected_type: 'Categorical',
    pandas_dtype: 'string',
    unique_count: 17,
    null_count: 12,
    null_percentage: 0.2,
    sample_values: ['Phones', 'Chairs', 'Storage', 'Binders'],
    suggested_role: 'dimension',
  },
  {
    name: 'Customer_Segment',
    detected_type: 'Categorical',
    pandas_dtype: 'string',
    unique_count: 3,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: ['Consumer', 'Corporate', 'Home Office'],
    suggested_role: 'dimension',
  },
  {
    name: 'Sales_Amount',
    detected_type: 'Numeric',
    pandas_dtype: 'float64',
    unique_count: 4890,
    null_count: 35,
    null_percentage: 0.7,
    sample_values: [261.96, 731.94, 14.62, 957.57],
    suggested_role: 'measure',
  },
  {
    name: 'Profit',
    detected_type: 'Numeric',
    pandas_dtype: 'float64',
    unique_count: 3780,
    null_count: 24,
    null_percentage: 0.5,
    sample_values: [41.91, 219.58, 6.87, -383.03],
    suggested_role: 'measure',
  },
  {
    name: 'Quantity_Sold',
    detected_type: 'Numeric',
    pandas_dtype: 'int64',
    unique_count: 14,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: [2, 3, 5, 7, 9],
    suggested_role: 'measure',
  },
  {
    name: 'Discount_Rate',
    detected_type: 'Numeric',
    pandas_dtype: 'float64',
    unique_count: 12,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: [0.0, 0.2, 0.7, 0.15],
    suggested_role: 'measure',
  },
  {
    name: 'Shipping_Cost',
    detected_type: 'Numeric',
    pandas_dtype: 'float64',
    unique_count: 2450,
    null_count: 42,
    null_percentage: 0.8,
    sample_values: [12.4, 35.8, 4.2, 88.1],
    suggested_role: 'measure',
  },
  {
    name: 'Customer_ID',
    detected_type: 'Categorical',
    pandas_dtype: 'string',
    unique_count: 793,
    null_count: 0,
    null_percentage: 0.0,
    sample_values: ['CG-12520', 'DV-13045', 'SO-20335'],
    suggested_role: 'id',
  },
  {
    name: 'Unit_Price',
    detected_type: 'Numeric',
    pandas_dtype: 'float64',
    unique_count: 1980,
    null_count: 16,
    null_percentage: 0.3,
    sample_values: [130.98, 243.98, 7.31],
    suggested_role: 'measure',
  },
];

export default function DataProfileView({
  dashboard,
  onProceedToCleaning,
}: DataProfileViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const rawColumns: ColumnProfileItem[] =
    dashboard?.columns && dashboard.columns.length > 0
      ? dashboard.columns
      : SAMPLE_COLUMNS;

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
    } else if (t.includes('cat') || t.includes('str') || t.includes('id')) {
      acc['categorical'] = (acc['categorical'] || 0) + 1;
    } else if (t.includes('date') || t.includes('time')) {
      acc['date'] = (acc['date'] || 0) + 1;
    } else {
      acc['text'] = (acc['text'] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Column Catalog & Schema Profiler
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dataset Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {dashboard?.dataset_name || 'sales_data.xlsx'} • {rawColumns.length} detected columns
          </p>
        </div>

        {onProceedToCleaning && (
          <button
            onClick={onProceedToCleaning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>Data Cleaning Report</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        )}
      </div>

      {/* Presentation Module 1: Filters */}
      <ColumnCatalogFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
      />

      {/* Presentation Module 2: Table */}
      <ColumnCatalogTable columns={filteredColumns} />

      {/* Presentation Module 3: Summary Pills */}
      <ColumnTypeSummaryPills
        numericCount={typeCounts['numeric'] || 6}
        categoricalCount={typeCounts['categorical'] || 5}
        dateCount={typeCounts['date'] || 1}
        textCount={typeCounts['text'] || 0}
      />
    </div>
  );
}
