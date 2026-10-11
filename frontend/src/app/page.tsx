'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { NavView } from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import SignupForm from '../components/auth/SignupForm';
import LoginForm from '../components/auth/LoginForm';

// 9 Modular Views
import LandingView from '../components/views/LandingView';
import UploadView from '../components/views/UploadView';
import ProgressView from '../components/views/ProgressView';
import DataProfileView from '../components/views/DataProfileView';
import CleaningView from '../components/views/CleaningView';
import DashboardView from '../components/views/DashboardView';
import WhyEngineView from '../components/views/WhyEngineView';
import InsightsView from '../components/views/InsightsView';
import ExportView from '../components/views/ExportView';
import DatasetChatModal from '../components/presentation/chat/DatasetChatModal';

// Custom State Hooks
import { useUpload } from '../hooks/useUpload';
import { useInvestigation } from '../hooks/useInvestigation';

export default function Home() {
  const [currentView, setCurrentView] = useState<NavView>('landing');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [focusedWhyMetric, setFocusedWhyMetric] = useState<string | undefined>(undefined);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'signup' | null>('signup');

  // Custom Hooks encapsulating API and state logic
  const {
    uploadedDataset,
    isUploading,
    processFile,
    processFiles,
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

  // Handle file upload with clean investigation state
  const handleFileUpload = async (fileOrFiles: File | File[]) => {
    resetInvestigation();
    return await processFiles(fileOrFiles);
  };

  // Handle benchmark selection with immediate analysis trigger
  const handleSelectSample = async (sampleType: 'retail' | 'marketing' | 'healthcare') => {
    resetInvestigation();
    try {
      const res = await selectSample(sampleType);
      if (res?.dataset_id) {
        await startJob(res.dataset_id);
        setCurrentView('analysis');
      }
    } catch (err) {
      console.error('Failed to trigger sample benchmark analysis:', err);
    }
  };

  // Reset Session
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('datasense_auth_token') : null;
    if (token) setAuthToken(token);
  }, []);

  const handleAuthSuccess = (token: string, name?: string) => {
    setAuthToken(token);
    if (name) setUserName(name);
    if (typeof window !== 'undefined') localStorage.setItem('datasense_auth_token', token);
    setShowAuthForm(null);
  };

  const handleLogout = () => {
    setAuthToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem('datasense_auth_token');
  };

  const handleReset = () => {
    resetUpload();
    resetInvestigation();
    setCurrentView('upload');
  };

  // Auth overlay when not logged in
  if (!authToken && showAuthForm) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#f5f8f7] to-[#e8efec] flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0c1815] text-emerald-400 flex items-center justify-center shadow-2xl shadow-[#0c1815]/20 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 6-6"/></svg>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0c1815] tracking-tight">DataSense AI</h1>
            <p className="text-xs text-slate-400 font-medium">Sign in to continue</p>
          </div>
          {showAuthForm === 'signup' ? (
            <SignupForm onSuccess={(t: string, n?: string) => handleAuthSuccess(t, n)} onGoToLogin={() => setShowAuthForm('login')} />
          ) : (
            <LoginForm onSuccess={(t: string, n?: string) => handleAuthSuccess(t, n)} onGoToSignup={() => setShowAuthForm('signup')} />
          )}
        </div>
      </div>
    );
  }

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
      {/* Collapsible Icon Rail Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        hasDataset={!!uploadedDataset || !!dashboardData}
        hasAnalyzed={!!dashboardData}
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onClose={() => setIsSidebarExpanded(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pl-[72px] md:pl-0">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          onReset={handleReset}
          showTimeFilter={currentView === 'dashboard'}
          onOpenChat={() => setIsChatOpen(true)}
          canChat={!!dashboardData || !!jobStatus?.job_id || !!uploadedDataset}
          onToggleMenu={() => setIsSidebarExpanded(!isSidebarExpanded)}
          authToken={authToken}
          userName={userName}
          onLoginClick={() => setShowAuthForm('login')}
          onSignupClick={() => setShowAuthForm('signup')}
          onLogout={handleLogout}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {currentView === 'upload' && (
            <UploadView
              onFileUpload={handleFileUpload}
              onStartAnalysis={handleStartAnalysis}
              uploadedDataset={uploadedDataset}
              isUploading={isUploading}
              onSelectSample={handleSelectSample}
            />
          )}

          {currentView === 'analysis' && (
            <ProgressView
              jobStatus={jobStatus}
              datasetName={uploadedDataset?.filename || 'dataset.csv'}
              onViewDashboard={() => setCurrentView('dashboard')}
              onRetry={handleReset}
            />
          )}

          {currentView === 'profile' && (
            <DataProfileView
              dashboard={dashboardData}
              uploadedDataset={uploadedDataset}
              onProceedToCleaning={() => setCurrentView('cleaning')}
            />
          )}

          {currentView === 'cleaning' && (
            <CleaningView
              dashboard={dashboardData}
              uploadedDataset={uploadedDataset}
              onContinueToDashboard={() => setCurrentView('dashboard')}
              onViewProfile={() => setCurrentView('profile')}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              dashboard={dashboardData}
              uploadedDataset={uploadedDataset}
              onStartAnalysis={handleStartAnalysis}
              onNavigateToInsights={() => setCurrentView('insights')}
              onNavigateToWhy={(metric?: string) => {
                if (metric) setFocusedWhyMetric(metric);
                setCurrentView('why');
              }}
            />
          )}

          {currentView === 'why' && (
            <WhyEngineView
              jobId={dashboardData?.job_id || jobStatus?.job_id || 'sample-job'}
              initialTargetMetric={focusedWhyMetric}
              onNavigateToDashboard={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'insights' && (
            <InsightsView
              dashboard={dashboardData}
              uploadedDataset={uploadedDataset}
              onStartAnalysis={handleStartAnalysis}
              onProceedToExport={() => setCurrentView('export')}
              onNavigateToWhy={(metric?: string) => {
                if (metric) setFocusedWhyMetric(metric);
                setCurrentView('why');
              }}
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
