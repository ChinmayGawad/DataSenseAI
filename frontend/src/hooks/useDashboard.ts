import { useState, useCallback } from 'react';
import { DrilldownResponse, investigateFinding } from '../lib/api';

export function useDashboard() {
  const [timeHorizon, setTimeHorizon] = useState('Last 30 Days');
  const [activeWhyChart, setActiveWhyChart] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState<string | null>(null);

  const toggleWhyChart = useCallback((chartId: string) => {
    setActiveWhyChart((prev) => (prev === chartId ? null : chartId));
  }, []);

  const triggerDrilldown = useCallback(async (jobId: string, findingId: string) => {
    setLoadingDrilldown(findingId);
    try {
      const res = await investigateFinding(jobId, findingId);
      setDrilldownData(res);
      return res;
    } catch (err) {
      console.error('Failed to load drilldown:', err);
      throw err;
    } finally {
      setLoadingDrilldown(null);
    }
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldownData(null);
  }, []);

  return {
    timeHorizon,
    setTimeHorizon,
    activeWhyChart,
    toggleWhyChart,
    drilldownData,
    loadingDrilldown,
    triggerDrilldown,
    closeDrilldown,
  };
}
