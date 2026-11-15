import { useState, useEffect, useCallback } from 'react';
import { AnalyticsOverviewData } from '../types/analytics';
import analyticsService from '../services/analyticsService';

interface UseAnalyticsReturn {
  data: AnalyticsOverviewData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  timeRange: '7d' | '30d' | 'all';
  setTimeRange: (range: '7d' | '30d' | 'all') => void;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAnalytics = (initialRange: '7d' | '30d' | 'all' = '7d'): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>(initialRange);

  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const response = await analyticsService.getOverview(timeRange);
        if (response.success) {
          setData(response.data);
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to load analytics'
            : 'Failed to load analytics';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => fetchAnalytics(true), [fetchAnalytics]);
  const refetch = useCallback(() => fetchAnalytics(false), [fetchAnalytics]);

  return {
    data,
    loading,
    refreshing,
    error,
    timeRange,
    setTimeRange,
    refresh,
    refetch,
  };
};

export default useAnalytics;
