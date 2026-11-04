import axios, { AxiosError, AxiosInstance } from 'axios';
import { HealthResponse } from '../types/api';

/**
 * Default API Base URL configuration.
 * For Android physical device via Expo Go: use your PC's local Wi-Fi IP (e.g., http://192.168.1.100:5000)
 * For Android Emulator: http://10.0.2.2:5000
 * For Web / iOS Simulator: http://localhost:5000
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach auth tokens when available in later milestones
apiClient.interceptors.request.use(
  (config) => {
    // Milestone 2 token injection will be handled here
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('[API] Request timed out');
    } else if (!error.response) {
      console.warn('[API] Network error - Is the backend server running and reachable?');
    }
    return Promise.reject(error);
  }
);

/**
 * Health check service
 */
export const fetchHealthCheck = async (customUrl?: string): Promise<HealthResponse> => {
  const client = customUrl ? axios.create({ baseURL: customUrl, timeout: 8000 }) : apiClient;
  const response = await client.get<HealthResponse>('/api/health');
  return response.data;
};

export default apiClient;

