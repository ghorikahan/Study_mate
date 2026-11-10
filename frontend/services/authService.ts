import axios from 'axios';
import apiClient, { setAuthToken } from './api';
import {
  AuthResponse,
  MeResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthData,
} from '../types/auth';

/**
 * Extract human-readable error message from backend or network error
 */
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please check your network connection.';
      }
      return 'Unable to connect to StudyMate server. Please check your backend connection.';
    }

    const data = error.response.data as {
      message?: string;
      errors?: Record<string, string>;
    };

    // If there are detailed field validation errors, extract the first one
    if (data?.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.values(data.errors);
      if (fieldErrors.length > 0) {
        return fieldErrors[0];
      }
    }

    if (data?.message) {
      return data.message;
    }

    if (error.response.status === 401) {
      return 'Invalid credentials or session expired.';
    }
    if (error.response.status === 404) {
      return 'Resource not found.';
    }
    if (error.response.status === 500) {
      return 'Server error. Please try again shortly.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Register a new user account
 * POST /api/auth/register
 */
export const registerApi = async (
  credentials: RegisterCredentials
): Promise<AuthData> => {
  const response = await apiClient.post<AuthResponse>(
    '/api/auth/register',
    credentials
  );

  const authData = response.data.data;
  setAuthToken(authData.token);
  return authData;
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
export const loginApi = async (
  credentials: LoginCredentials
): Promise<AuthData> => {
  const response = await apiClient.post<AuthResponse>(
    '/api/auth/login',
    credentials
  );

  const authData = response.data.data;
  setAuthToken(authData.token);
  return authData;
};

/**
 * Fetch current authenticated user profile
 * GET /api/auth/me
 */
export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<MeResponse>('/api/auth/me');
  return response.data.data.user;
};

/**
 * Logout from backend
 * POST /api/auth/logout
 */
export const logoutApi = async (): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    // Best-effort logout; failure to contact server shouldn't block local logout
    console.warn('[AuthService] Logout request warning:', error);
  } finally {
    setAuthToken(null);
  }
};

export default {
  register: registerApi,
  login: loginApi,
  getMe: getMeApi,
  logout: logoutApi,
  extractErrorMessage,
};
