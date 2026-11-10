import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { HealthResponse } from '../types/api';
import { getToken } from './storage';

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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// In-memory token cache for ultra-fast synchronous header injection
let cachedToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null): void => {
  cachedToken = token;
};

export const setOnUnauthorized = (callback: (() => void) | null): void => {
  unauthorizedCallback = callback;
};

// Request Interceptor: Attach Bearer auth token if present
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Prefer memory cache, fallback to SecureStore
    let token = cachedToken;
    if (!token) {
      token = await getToken();
      if (token) cachedToken = token;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling & 401 detection
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('[API] Request timed out. Check server responsiveness.');
    } else if (!error.response) {
      console.warn('[API] Network error - Is the backend server running and reachable at', apiClient.defaults.baseURL, '?');
    } else if (error.response.status === 401) {
      // Trigger logout if session has expired / invalid token
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
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
