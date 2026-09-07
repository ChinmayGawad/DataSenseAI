import { useState, useEffect, useRef, useCallback } from 'react';
import {
  startInvestigation,
  getJobStatus,
  getDashboard,
  JobStatusResponse,
  DashboardResponse,
} from '../lib/api';

export function useInvestigation() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupPolling;
  }, [cleanupPolling]);

  // Polling loop for job status
  useEffect(() => {
    if (!activeJobId) {
      cleanupPolling();
      return;
    }

    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      cleanupPolling();
      setIsAnalyzing(false);
      return;
    }

    const poll = async () => {
      try {
        const status = await getJobStatus(activeJobId);
        setJobStatus(status);

        if (status.status === 'completed') {
          cleanupPolling();
          setIsAnalyzing(false);
          const dash = await getDashboard(activeJobId);
          setDashboardData(dash);
        } else if (status.status === 'failed') {
          cleanupPolling();
          setIsAnalyzing(false);
          setInvestigationError(status.error_message || 'Investigation failed');
        }
      } catch (err: any) {
        console.error('Error in status polling:', err);
      }
    };

    pollIntervalRef.current = setInterval(poll, 1500);
    poll(); // Run immediately

    return cleanupPolling;
  }, [activeJobId, jobStatus?.status, cleanupPolling]);

  const startJob = useCallback(
    async (datasetId: string) => {
      setInvestigationError(null);
      setIsAnalyzing(true);
      try {
        const res = await startInvestigation(datasetId);
        setActiveJobId(res.job_id);
        return res.job_id;
      } catch (err: any) {
        setIsAnalyzing(false);
        const msg = err.message || 'Failed to start investigation';
        setInvestigationError(msg);
        throw err;
      }
    },
    []
  );

  const resetInvestigation = useCallback(() => {
    cleanupPolling();
    setActiveJobId(null);
    setJobStatus(null);
    setDashboardData(null);
    setIsAnalyzing(false);
    setInvestigationError(null);
  }, [cleanupPolling]);

  return {
    activeJobId,
    jobStatus,
    dashboardData,
    isAnalyzing,
    investigationError,
    startJob,
    resetInvestigation,
  };
}
