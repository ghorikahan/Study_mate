import { useState, useEffect, useCallback } from 'react';
import { fetchHealthCheck, API_BASE_URL } from '../services/api';
import { HealthResponse } from '../types/api';

export type HealthStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export interface UseBackendHealthReturn {
  status: HealthStatus;
  data: HealthResponse | null;
  error: string | null;
  latency: number | null;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  checkHealth: (targetUrl?: string) => Promise<void>;
}

export const useBackendHealth = (initialUrl: string = API_BASE_URL): UseBackendHealthReturn => {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(initialUrl);

  const checkHealth = useCallback(
    async (targetUrl?: string) => {
      const activeUrl = targetUrl || apiUrl;
      setStatus('checking');
      setError(null);
      const startTime = Date.now();

      try {
        const response = await fetchHealthCheck(activeUrl);
        const elapsed = Date.now() - startTime;
        setLatency(elapsed);
        setData(response);
        setStatus('connected');
      } catch (err: any) {
        const elapsed = Date.now() - startTime;
        setLatency(elapsed);
        setData(null);
        setStatus('disconnected');

        let msg = 'Unable to reach backend server.';
        if (err.code === 'ECONNABORTED') {
          msg = 'Connection timed out after 8s.';
        } else if (err.response) {
          msg = `Server returned HTTP ${err.response.status}`;
        } else if (err.message) {
          msg = err.message;
        }
        setError(msg);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    status,
    data,
    error,
    latency,
    apiUrl,
    setApiUrl,
    checkHealth,
  };
};

export default useBackendHealth;

