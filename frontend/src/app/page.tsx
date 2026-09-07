'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadSection from '../components/UploadSection';
import AgentTimeline from '../components/AgentTimeline';
import DashboardView from '../components/DashboardView';
import { getDashboard, DashboardResponse } from '../lib/api';

type AppState = 'upload' | 'investigating' | 'dashboard';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const handleInvestigationStarted = (jobId: string, filename: string) => {
    setActiveJobId(jobId);
    setDatasetName(filename);
    setState('investigating');
  };

  const handleInvestigationFinished = async (jobId: string) => {
    setLoadingDashboard(true);
    try {
      const data = await getDashboard(jobId);
      setDashboardData(data);
      setState('dashboard');
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleReset = () => {
    setState('upload');
    setActiveJobId(null);
    setDashboardData(null);
    setDatasetName('');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#090a0f] text-slate-100">
      <Navbar
        onReset={handleReset}
        showReset={state === 'dashboard'}
        activeDataset={datasetName}
      />

      <main className="flex-1 flex flex-col justify-center">
        {state === 'upload' && (
          <UploadSection onInvestigationStarted={handleInvestigationStarted} />
        )}

        {state === 'investigating' && activeJobId && (
          <AgentTimeline
            jobId={activeJobId}
            datasetName={datasetName}
            onInvestigationFinished={handleInvestigationFinished}
          />
        )}

        {state === 'dashboard' && dashboardData && (
          <DashboardView
            dashboard={dashboardData}
            onNewInvestigation={handleReset}
          />
        )}

        {loadingDashboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-sm font-medium text-white">Hydrating Self-Designing Dashboard...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          DataSense AI · Autonomous Multi-Agent Data Investigation Platform · Powered by Antigravity & DeepSeek Harness
        </p>
      </footer>
    </div>
  );
}
