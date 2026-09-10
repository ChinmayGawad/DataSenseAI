import { useState, useEffect, useRef, useCallback } from 'react';
import {
  API_BASE_URL,
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
  const [isStreaming, setIsStreaming] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupSubscriptions = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return cleanupSubscriptions;
  }, [cleanupSubscriptions]);

  // Real-time SSE streaming with automatic polling fallback
  useEffect(() => {
    if (!activeJobId) {
      cleanupSubscriptions();
      return;
    }

    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      cleanupSubscriptions();
      setIsAnalyzing(false);
      return;
    }

    const startPolling = () => {
      if (pollIntervalRef.current) return;
      setIsStreaming(false);

      const poll = async () => {
        try {
          const status = await getJobStatus(activeJobId);
          setJobStatus(status);

          if (status.status === 'completed') {
            cleanupSubscriptions();
            setIsAnalyzing(false);
            const dash = await getDashboard(activeJobId);
            setDashboardData(dash);
          } else if (status.status === 'failed') {
            cleanupSubscriptions();
            setIsAnalyzing(false);
            setInvestigationError(status.error_message || 'Investigation failed');
          }
        } catch (err: any) {
          console.error('Error in status polling:', err);
        }
      };

      pollIntervalRef.current = setInterval(poll, 1500);
      poll();
    };

    // Attempt Server-Sent Events first for real-time sub-100ms updates
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const streamUrl = `${API_BASE_URL}/status/${activeJobId}/stream`;
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;
        setIsStreaming(true);

        es.onmessage = async (e) => {
          try {
            const data = JSON.parse(e.data);

            if (data.type === 'init') {
              setJobStatus((prev) => ({
                job_id: data.job_id,
                dataset_id: data.job_id,
                status: data.status,
                progress_percentage: data.progress_percentage || 0,
                summary: data.summary,
                logs: data.logs || [],
                plan: prev?.plan || [],
                updated_at: new Date().toISOString(),
              }));
            } else if (data.type === 'update') {
              setJobStatus((prev) => {
                const existingLogs = prev?.logs || [];
                const incomingLogs = data.new_logs || [];
                const mergedLogs = [...existingLogs];
                for (const nl of incomingLogs) {
                  if (!mergedLogs.some((el) => el.id === nl.id)) {
                    mergedLogs.push(nl);
                  }
                }
                return {
                  job_id: data.job_id,
                  dataset_id: data.job_id,
                  status: data.status,
                  current_agent: data.current_agent,
                  progress_percentage: data.progress_percentage,
                  health_score: data.health_score ?? prev?.health_score,
                  summary: data.summary ?? prev?.summary,
                  logs: mergedLogs,
                  plan: prev?.plan || [],
                  updated_at: new Date().toISOString(),
                };
              });
            } else if (data.type === 'complete') {
              cleanupSubscriptions();
              setIsAnalyzing(false);
              const dash = await getDashboard(activeJobId);
              setDashboardData(dash);
            } else if (data.type === 'error' || data.type === 'timeout') {
              cleanupSubscriptions();
              startPolling();
            }
          } catch (err) {
            console.error('Error in SSE message handling:', err);
          }
        };

        es.onerror = () => {
          cleanupSubscriptions();
          startPolling();
        };
      } catch {
        startPolling();
      }
    } else {
      startPolling();
    }

    return cleanupSubscriptions;
  }, [activeJobId, jobStatus?.status, cleanupSubscriptions]);

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
    cleanupSubscriptions();
    setActiveJobId(null);
    setJobStatus(null);
    setDashboardData(null);
    setIsAnalyzing(false);
    setInvestigationError(null);
  }, [cleanupSubscriptions]);

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
