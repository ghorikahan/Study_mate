import apiClient from './api';
import {
  CreateStudySessionInput,
  StudySessionFilters,
  StudySessionsResponse,
  StudySessionStatsResponse,
  StudySessionSingleResponse,
} from '../types/studySession';

const BASE = '/api/study-sessions';

export const getStudySessions = async (
  filters?: StudySessionFilters
): Promise<StudySessionsResponse> => {
  const params: Record<string, string | number> = {};
  if (filters?.subject) params.subject = filters.subject;
  if (filters?.sessionType) params.sessionType = filters.sessionType;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;

  const response = await apiClient.get<StudySessionsResponse>(BASE, { params });
  return response.data;
};

export const createStudySession = async (
  input: CreateStudySessionInput
): Promise<StudySessionSingleResponse> => {
  const response = await apiClient.post<StudySessionSingleResponse>(BASE, input);
  return response.data;
};

export const getStats = async (): Promise<StudySessionStatsResponse> => {
  const response = await apiClient.get<StudySessionStatsResponse>(`${BASE}/stats`);
  return response.data;
};

export const getStudySessionById = async (id: string): Promise<StudySessionSingleResponse> => {
  const response = await apiClient.get<StudySessionSingleResponse>(`${BASE}/${id}`);
  return response.data;
};

export const deleteStudySession = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`${BASE}/${id}`);
  return response.data;
};

export const studySessionService = {
  getStudySessions,
  createStudySession,
  getStats,
  getStudySessionById,
  deleteStudySession,
};

export default studySessionService;
