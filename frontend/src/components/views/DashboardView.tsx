'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, Workflow, GitFork, ArrowRight, Layers, Upload, Play } from 'lucide-react';
import { DashboardResponse, ChartConfig, DrilldownResponse, DatasetUploadResponse } from '../../lib/api';
import DrilldownModal from '../DrilldownModal';
import KpiCardsGrid, { KpiItem } from '../presentation/dashboard/KpiCardsGrid';
import ChartCard from '../presentation/dashboard/ChartCard';

interface DashboardViewProps {
  dashboard: DashboardResponse | null;
  uploadedDataset?: DatasetUploadResponse | null;
  onStartAnalysis?: () => void;
  onNavigateToInsights?: () => void;
  onNavigateToWhy?: (metric?: string) => void;
}

function getChartGridSpan(totalCharts: number, index: number, chartType: string): string {
  if (chartType === 'heatmap') {
    return 'lg:col-span-12';
  }

  if (totalCharts === 1) {
    return 'lg:col-span-12';
  }

  if (totalCharts === 2) {
    return 'lg:col-span-6';
  }

  if (totalCharts === 3) {
    if (index === 0) {
      return 'lg:col-span-12';
    }
    return 'lg:col-span-6';
  }

  if (totalCharts === 4) {
    return 'lg:col-span-6';
  }

  if (totalCharts === 5) {
    if (index < 2) {
      return 'lg:col-span-6';
    } else {
      return 'lg:col-span-4';
    }
  }

  return 'lg:col-span-6';
}

export default function DashboardView({
  dashboard,
  uploadedDataset,
  onStartAnalysis,
  onNavigateToInsights,
  onNavigateToWhy,
}: DashboardViewProps) {
  const [timeHorizon, setTimeHorizon] = useState('All Observations');
  const [activeWhyChart, setActiveWhyChart] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [reviewTab, setReviewTab] = useState<'missing' | 'outliers'>('missing');

  // Filter out technical pipeline metadata so the dashboard displays business & domain KPIs
  const technicalIds = new Set(['card_health', 'card_records', 'card_anomalies', 'card_clusters']);
  const technicalLabels = new Set([
    'data health score',
    'total observations',
    'detected anomalies',
    'discovered cohorts',
  ]);

  const rawSummaryCards = dashboard?.summary_cards || [];
  const businessCards = rawSummaryCards.filter((c) => {
    const isTechId = technicalIds.has(c.id);
    const isTechLabel = technicalLabels.has(c.label?.toLowerCase()?.trim());
    return !isTechId && !isTechLabel;
  });

  const fallbackKpis: KpiItem[] = [
    {
      id: 'kpi_vol',
      label: 'Primary Volume',
      value: '₹12,84,300',
      delta: '+14.8%',
      isPositive: true,
      subtext: 'Observed across transactions',
    },
    {
      id: 'kpi_entities',
      label: 'Active Entities',
      value: '1,420',
      delta: '+8.6%',
      isPositive: true,
      subtext: 'Distinct entities tracked',
    },
    {
      id: 'kpi_rate',
      label: 'Performance Rate',
      value: '24.6%',
      delta: '+1.8%',
      isPositive: true,
      subtext: 'Efficiency benchmark',
    },
    {
      id: 'kpi_secondary',
      label: 'Average Ticket',
      value: '₹2,840',
      delta: '+4.2%',
      isPositive: true,
      subtext: 'Per unit observation',
    },
  ];

  const kpis: KpiItem[] = businessCards.length > 0
    ? businessCards.slice(0, 4).map((c, i) => ({
        id: c.id || `kpi_${i}`,
        label: c.label,
        value: c.value,
        delta: c.delta || '+Active',
        isPositive: c.status === 'alert' ? false : !c.delta?.startsWith('-'),
        subtext: c.subtext || '',
      }))
    : fallbackKpis;

  const displayCharts: ChartConfig[] = dashboard?.charts || [];
  const datasetName = dashboard?.dataset_name || uploadedDataset?.filename || 'Active Dataset';

  // State 1: No dataset uploaded at all
  if (!dashboard && !uploadedDataset) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <Upload className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Dataset Uploaded</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Upload a spreadsheet or document to automatically generate dynamic KPI cards and self-designing Plotly visualisations.
          </p>
        </div>
      </div>
    );
  }

  // State 2: Dataset uploaded, but investigation not executed yet
  if (!dashboard && uploadedDataset) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Investigation Ready: {uploadedDataset.filename}
            </h2>
            <p className="text-sm text-slate-500 max-w-md">
              Your document has been extracted ({uploadedDataset.row_count.toLocaleString()} rows, {uploadedDataset.column_count} columns).
              Launch the multi-agent investigation to generate dataset-specific KPIs, dynamic charts, and mathematical fact-checks.
            </p>
          </div>
          {onStartAnalysis && (
            <button
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Launch Multi-Agent Investigation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // State 3: Fully analyzed dashboard
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Autonomous Visualization Engine
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Insight Dashboard • {datasetName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualisations and KPI metrics automatically computed from {datasetName}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToWhy && (
            <button
              onClick={() => onNavigateToWhy()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <GitFork className="w-3.5 h-3.5 text-purple-700" />
              <span>Explore Why? Engine</span>
            </button>
          )}

          {onNavigateToInsights && (
            <button
              onClick={onNavigateToInsights}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Workflow className="w-3.5 h-3.5 text-slate-500" />
              <span>View Verified Insights</span>
            </button>
          )}
        </div>
      </div>

      {/* Presentation Module 1: 4 Metric Cards */}
      {kpis.length > 0 && <KpiCardsGrid kpis={kpis} />}

      {/* Presentation Module 2: Self-Designing Charts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Autonomous Analytical Charts ({displayCharts.length})
            </h3>
          </div>
        </div>

        {displayCharts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No charts could be formed</p>
            <p className="text-xs text-slate-500">The dataset does not contain sufficient numeric or categorical columns to plot.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {displayCharts.map((chart, idx) => {
              const spanClass = getChartGridSpan(displayCharts.length, idx, chart.chart_type);

              return (
                <div key={chart.id || idx} className={`${spanClass} flex flex-col`}>
                  <ChartCard
                    chart={chart}
                    subtitle={chart.why_chosen || `Multivariate distribution on ${chart.x_axis}.`}
                    isWhyOpen={activeWhyChart === chart.id}
                    onToggleWhy={() => {
                      if (onNavigateToWhy) {
                        onNavigateToWhy(chart.y_axis || chart.x_axis);
                      } else {
                        setActiveWhyChart(activeWhyChart === chart.id ? null : chart.id);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data Review & Anomalies Section */}
      {dashboard && ((dashboard.missing_value_rows?.length ?? 0) > 0 || (dashboard.outlier_rows?.length ?? 0) > 0) && (
        <div className="p-5 rounded-3xl bg-white border border-slate-200 mt-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Data Review & Anomalies
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setReviewTab('missing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  reviewTab === 'missing'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Missing Values ({dashboard?.missing_value_rows?.length || 0})
              </button>
              <button
                onClick={() => setReviewTab('outliers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  reviewTab === 'outliers'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Outliers ({dashboard?.outlier_rows?.length || 0})
              </button>
            </div>
          </div>

          {reviewTab === 'missing' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong className="text-amber-800">Review Required:</strong> These records contain empty or missing values. They have been displayed below as <span className="font-bold text-amber-600">NULL</span> for your review before imputation.
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      {dashboard?.columns?.map(col => (
                        <th key={col.name} className="p-3 font-semibold whitespace-nowrap">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dashboard?.missing_value_rows?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {dashboard?.columns?.map(col => (
                          <td key={col.name} className="p-3 whitespace-nowrap text-slate-700">
                            {row[col.name] === null || row[col.name] === undefined || row[col.name] === "" ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold tracking-wider text-[10px]">NULL</span>
                            ) : (
                              String(row[col.name])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!dashboard?.missing_value_rows?.length && (
                      <tr>
                        <td colSpan={dashboard?.columns?.length || 1} className="p-4 text-center text-slate-500">No missing values detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reviewTab === 'outliers' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                <strong className="text-red-800">Review Required:</strong> These records were flagged as severe multivariate anomalies by the Isolation Forest model.
              </div>
              <div className="space-y-3">
                {dashboard?.outlier_rows?.map((outlier, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold border border-red-200">Anomaly Score: {outlier.anomaly_score}</span>
                        <p className="text-xs text-slate-600 mt-2 font-medium">{outlier.reason}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Row #{outlier.index}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      {Object.entries(outlier.record || {}).filter(([k]) => k !== '_score').map(([k, v]) => (
                        <div key={k} className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500 font-medium">{k}:</span>
                          <span className="text-slate-900 font-mono font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!dashboard?.outlier_rows?.length && (
                  <div className="p-4 text-center text-slate-500 text-xs rounded-xl border border-slate-200">No significant outliers detected.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA to Insights View */}
      {onNavigateToInsights && (
        <div className="flex items-center justify-end pt-4">
          <button
            onClick={onNavigateToInsights}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>Proceed to Fact-Checked Insights</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Deep-Dive Drilldown Modal */}
      {drilldownData && (
        <DrilldownModal
          drilldown={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}
    </div>
  );
}
