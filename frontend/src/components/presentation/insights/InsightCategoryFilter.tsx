'use client';

import React from 'react';

interface InsightCategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function InsightCategoryFilter({
  categories,
  activeCategory,
  onSelectCategory,
}: InsightCategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
            activeCategory === cat
              ? 'bg-[#0c1815] text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {cat === 'all' ? 'All Findings' : cat}
        </button>
      ))}
    </div>
  );
}
