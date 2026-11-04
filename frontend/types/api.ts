export interface HealthResponse {
  status: 'ok' | 'error';
  app: string;
  tagline: string;
  environment: string;
  timestamp: string;
  uptime: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
    connected: boolean;
    host: string | null;
    name: string | null;
  };
}

export interface RootApiResponse {
  status: string;
  app: string;
  tagline: string;
  version: string;
  documentation: string;
  endpoints: {
    health: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

