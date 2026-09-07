'use client';

import React, { useState } from 'react';
import Sidebar, { NavView } from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

// 8 Modular Views
import LandingView from '../components/views/LandingView';
import UploadView from '../components/views/UploadView';
import ProgressView from '../components/views/ProgressView';
import DataProfileView from '../components/views/DataProfileView';
import CleaningView from '../components/views/CleaningView';
import DashboardView from '../components/views/DashboardView';
import InsightsView from '../components/views/InsightsView';
import ExportView from '../components/views/ExportView';
import DatasetChatModal from '../components/presentation/chat/DatasetChatModal';

// Custom State Hooks
import { useUpload } from '../hooks/useUpload';
import { useInvestigation } from '../hooks/useInvestigation';

export default function Home() {
  const [currentView, setCurrentView] = useState<NavView>('landing');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Custom Hooks encapsulating API and state logic
  const {
    uploadedDataset,
    isUploading,
    processFile,
    selectSample,
    resetUpload,
  } = useUpload();

  const {
    jobStatus,
    dashboardData,
    startJob,
    resetInvestigation,
  } = useInvestigation();

  // Orchestrating Investigation Start
  const handleStartAnalysis = async () => {
    if (!uploadedDataset) return;
    try {
      await startJob(uploadedDataset.dataset_id);
      setCurrentView('analysis');
    } catch (err) {
      console.error('Failed to trigger investigation:', err);
    }
  };

  // Reset Session
  const handleReset = () => {
    resetUpload();
    resetInvestigation();
    setCurrentView('upload');
  };

  // Screen 1: Full-page Landing View
  if (currentView === 'landing') {
    return (
      <LandingView
        onStartUpload={() => setCurrentView('upload')}
      />
    );
  }

  // Screens 2 - 8: Multi-View Dashboard with Persistent Sidebar Navigation
  return (
    <div className="flex min-h-[100dvh] bg-[#f5f8f7] text-slate-800 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        hasDataset={!!uploadedDataset || !!dashboardData}
        hasAnalyzed={!!dashboardData}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          onReset={handleReset}
          showTimeFilter={currentView === 'dashboard'}
          onOpenChat={() => setIsChatOpen(true)}
          canChat={!!dashboardData || !!jobStatus?.job_id || !!uploadedDataset}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {currentView === 'upload' && (
            <UploadView
              onFileUpload={processFile}
              onStartAnalysis={handleStartAnalysis}
              uploadedDataset={uploadedDataset}
              isUploading={isUploading}
              onSelectSample={selectSample}
            />
          )}

          {currentView === 'analysis' && (
            <ProgressView
              jobStatus={jobStatus}
              onViewDashboard={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'profile' && (
            <DataProfileView
              dashboard={dashboardData}
              onProceedToCleaning={() => setCurrentView('cleaning')}
            />
          )}

          {currentView === 'cleaning' && (
            <CleaningView
              dashboard={dashboardData}
              onContinueToDashboard={() => setCurrentView('dashboard')}
              onViewProfile={() => setCurrentView('profile')}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              dashboard={dashboardData}
              onNavigateToInsights={() => setCurrentView('insights')}
            />
          )}

          {currentView === 'insights' && (
            <InsightsView
              dashboard={dashboardData}
              onProceedToExport={() => setCurrentView('export')}
            />
          )}

          {currentView === 'export' && (
            <ExportView
              dashboard={dashboardData}
              onUploadAnother={handleReset}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          )}
        </main>

        {/* Dataset Chat Modal */}
        <DatasetChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          jobId={dashboardData?.job_id || jobStatus?.job_id || 'sample-job'}
          datasetName={dashboardData?.dataset_name || uploadedDataset?.filename || 'Retail Sales Dataset'}
        />
      </div>
    </div>
  );
}
