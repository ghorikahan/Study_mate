import apiClient from './api';
import { AnalyticsOverviewResponse } from '../types/analytics';

const BASE = '/api/analytics';

export const getOverview = async (timeRange: string = '7d'): Promise<AnalyticsOverviewResponse> => {
  const response = await apiClient.get<AnalyticsOverviewResponse>(`${BASE}/overview`, {
    params: { timeRange },
  });
  return response.data;
};

export const analyticsService = {
  getOverview,
};

export default analyticsService;
