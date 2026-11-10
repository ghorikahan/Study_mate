import apiClient from './api';
import { DashboardResponse, DashboardSummary } from '../types/dashboard';

/**
 * Fetch real-time dashboard summary calculated from MongoDB
 * GET /api/dashboard/summary
 */
export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardResponse>('/api/dashboard/summary');
  return response.data.data;
};

export default {
  fetchDashboardSummary,
};

