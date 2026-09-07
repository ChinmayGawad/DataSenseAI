'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Code2,
  Sparkles,
} from 'lucide-react';
import { DashboardResponse } from '../../lib/api';
import ExportOptionCard from '../presentation/export/ExportOptionCard';
import ShareLinkBox from '../presentation/export/ShareLinkBox';
import CompletionBanner from '../presentation/export/CompletionBanner';

interface ExportViewProps {
  dashboard: DashboardResponse | null;
  onUploadAnother: () => void;
  onBackToDashboard: () => void;
}

export default function ExportView({
  dashboard,
  onUploadAnother,
  onBackToDashboard,
}: ExportViewProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/${dashboard?.job_id || 'sample-job-883'}`
    : 'https://datasense.ai/dashboard/sample-job-883';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: string) => {
    setDownloadingFormat(format);
    setTimeout(() => {
      const blob = new Blob([
        `DataSense AI Investigation Export (${format.toUpperCase()})\n` +
        `Dataset: ${dashboard?.dataset_name || 'sales_data.xlsx'}\n` +
        `Health Score: ${dashboard?.health_score || 98}%\n` +
        `Generated: ${new Date().toISOString()}\n`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datasense_${dashboard?.dataset_name || 'dataset'}_cleaned.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : format === 'html' ? 'html' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadingFormat(null);
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Export & Reporting Suite
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Export Your Results
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Download cleaned datasets, share read-only dashboards, or generate executive PDF summaries.
        </p>
      </div>

      {/* Presentation Module 1: 4 Export Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Cleaned Dataset */}
        <ExportOptionCard
          title="Cleaned Dataset"
          description="All missing values imputed, duplicates pruned, and types standardized."
          icon={FileSpreadsheet}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-700"
          hoverBorderColor="hover:border-emerald-300"
          actions={[
            {
              label: 'CSV (.csv)',
              onClick: () => handleDownload('csv'),
              disabled: downloadingFormat === 'csv',
            },
            {
              label: 'Excel (.xlsx)',
              onClick: () => handleDownload('excel'),
              disabled: downloadingFormat === 'excel',
            },
          ]}
        />

        {/* Card 2: Full Report PDF */}
        <ExportOptionCard
          title="Full Report"
          description="Executive summary, KPI breakdown, chart snapshots, and verified findings."
          icon={FileText}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-700"
          hoverBorderColor="hover:border-rose-300"
          actions={[
            {
              label: 'Download PDF Report (.pdf)',
              onClick: () => handleDownload('pdf'),
              disabled: downloadingFormat === 'pdf',
            },
          ]}
        />

        {/* Card 3: Dashboard as Image */}
        <ExportOptionCard
          title="Dashboard as Image"
          description="High-resolution vector-rendered graphic snapshot of the complete dashboard."
          icon={ImageIcon}
          iconBgColor="bg-purple-50"
          iconTextColor="text-purple-700"
          hoverBorderColor="hover:border-purple-300"
          actions={[
            {
              label: 'Export High-Res PNG (.png)',
              onClick: () => handleDownload('png'),
              disabled: downloadingFormat === 'png',
            },
          ]}
        />

        {/* Card 4: Interactive HTML Dashboard */}
        <ExportOptionCard
          title="Interactive Dashboard"
          description="Self-contained offline HTML file with interactive Plotly charts and zoom tools."
          icon={Code2}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-700"
          hoverBorderColor="hover:border-blue-300"
          actions={[
            {
              label: 'Download Standalone HTML (.html)',
              onClick: () => handleDownload('html'),
              disabled: downloadingFormat === 'html',
            },
          ]}
        />
      </div>

      {/* Presentation Module 2: Share Section */}
      <ShareLinkBox
        shareUrl={shareUrl}
        copied={copied}
        onCopyLink={handleCopyLink}
      />

      {/* Presentation Module 3: Completion Banner */}
      <CompletionBanner
        onUploadAnother={onUploadAnother}
        onBackToDashboard={onBackToDashboard}
      />
    </div>
  );
}
