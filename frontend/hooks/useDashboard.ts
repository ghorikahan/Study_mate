import { useState, useEffect, useCallback } from 'react';
import { DashboardSummary } from '../types/dashboard';
import { fetchDashboardSummary } from '../services/dashboardService';
import { extractErrorMessage } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export interface UseDashboardReturn {
  summary: DashboardSummary | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const { isAuthenticated, token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      console.warn('[useDashboard] Failed to fetch dashboard summary:', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const refetch = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  return {
    summary,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
  };
};

export default useDashboard;

