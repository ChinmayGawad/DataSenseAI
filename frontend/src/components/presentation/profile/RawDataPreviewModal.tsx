'use client';

import React, { useEffect } from 'react';
import { X, Table } from 'lucide-react';

interface RawDataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName?: string;
  rawRows?: Record<string, any>[];
  totalRows?: number;
}

const FALLBACK_RAW_ROWS = [
  {
    '#': 1,
    'Order_Date': '2024-01-15',
    'Region': 'West',
    'Category': 'Technology',
    'Sub_Category': 'Phones',
    'Sales_Amount': '₹24,500',
    'Profit': '₹5,400',
    'Discount_Rate': '0.05',
    'Customer_ID': 'CUST-10492',
    'Status': 'Delivered',
  },
  {
    '#': 2,
    'Order_Date': '2024-01-16',
    'Region': 'North',
    'Category': 'Furniture',
    'Sub_Category': 'Chairs',
    'Sales_Amount': '₹8,900',
    'Profit': '₹1,200',
    'Discount_Rate': '0.10',
    'Customer_ID': 'CUST-10821',
    'Status': 'Delivered',
  },
  {
    '#': 3,
    'Order_Date': '2024-01-18',
    'Region': 'East',
    'Category': 'Office Supplies',
    'Sub_Category': 'Storage',
    'Sales_Amount': '₹3,400',
    'Profit': '₹650',
    'Discount_Rate': '0.00',
    'Customer_ID': 'CUST-11044',
    'Status': 'Delivered',
  },
  {
    '#': 4,
    'Order_Date': '2024-01-20',
    'Region': 'West',
    'Category': 'Technology',
    'Sub_Category': 'Laptops',
    'Sales_Amount': '₹54,000',
    'Profit': '₹12,800',
    'Discount_Rate': '0.05',
    'Customer_ID': 'CUST-10291',
    'Status': 'Delivered',
  },
  {
    '#': 5,
    'Order_Date': '2024-01-22',
    'Region': 'South',
    'Category': 'Furniture',
    'Sub_Category': 'Tables',
    'Sales_Amount': '₹14,200',
    'Profit': '-₹1,400',
    'Discount_Rate': '0.25',
    'Customer_ID': 'CUST-11409',
    'Status': 'Returned',
  },
  {
    '#': 6,
    'Order_Date': '2024-01-25',
    'Region': 'Central',
    'Category': 'Technology',
    'Sub_Category': 'Accessories',
    'Sales_Amount': '₹4,800',
    'Profit': '₹980',
    'Discount_Rate': '0.00',
    'Customer_ID': 'CUST-10773',
    'Status': 'Delivered',
  },
  {
    '#': 7,
    'Order_Date': '2024-01-27',
    'Region': 'West',
    'Category': 'Office Supplies',
    'Sub_Category': 'Paper',
    'Sales_Amount': '₹1,200',
    'Profit': '₹340',
    'Discount_Rate': '0.00',
    'Customer_ID': 'CUST-12190',
    'Status': 'Delivered',
  },
  {
    '#': 8,
    'Order_Date': '2024-01-30',
    'Region': 'North',
    'Category': 'Technology',
    'Sub_Category': 'Phones',
    'Sales_Amount': '₹31,000',
    'Profit': '₹7,200',
    'Discount_Rate': '0.05',
    'Customer_ID': 'CUST-10118',
    'Status': 'Delivered',
  },
];

export default function RawDataPreviewModal({
  isOpen,
  onClose,
  datasetName = 'Active Dataset',
  rawRows,
  totalRows,
}: RawDataPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayRows: Record<string, any>[] = (rawRows && rawRows.length > 0 ? rawRows : FALLBACK_RAW_ROWS) as Record<string, any>[];
  const headers = displayRows.length > 0 ? Object.keys(displayRows[0]) : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Raw Data Preview</h3>
              <p className="text-xs text-slate-500">
                Displaying sample records from <span className="font-medium text-slate-700">{datasetName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                {headers.map((h) => (
                  <th key={h} className="py-3 px-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {displayRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  {headers.map((h) => (
                    <td key={h} className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {String(row[h] !== undefined && row[h] !== null ? row[h] : '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {displayRows.length} sample records
            {totalRows ? ` of ${totalRows.toLocaleString()} total observations` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white font-semibold transition-all shadow-xs cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
