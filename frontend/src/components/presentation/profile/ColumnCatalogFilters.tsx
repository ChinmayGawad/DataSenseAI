'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface ColumnCatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
}

export default function ColumnCatalogFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
}: ColumnCatalogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search column names..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#0c1815] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Columns
        </button>
        <button
          onClick={() => onFilterChange('numeric')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            filterType === 'numeric'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Numeric
        </button>
        <button
          onClick={() => onFilterChange('categorical')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            filterType === 'categorical'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          Categorical
        </button>
        <button
          onClick={() => onFilterChange('date')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            filterType === 'date'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Date
        </button>
      </div>
    </div>
  );
}
