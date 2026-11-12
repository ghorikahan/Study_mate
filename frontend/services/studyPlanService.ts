import apiClient from './api';
import {
  StudyPlan,
  CreateStudyPlanInput,
  UpdateStudyPlanInput,
  StudyPlanFilters,
  StudyPlansResponse,
  StudyPlanSingleResponse,
  StudyPlanStatus,
} from '../types/studyPlan';

/**
 * Fetch all study plans with optional query filters
 * GET /api/study-plans
 */
export const getStudyPlans = async (
  filters?: StudyPlanFilters
): Promise<{ studyPlans: StudyPlan[]; total: number; subjects: string[] }> => {
  const params: Record<string, string> = {};

  if (filters?.subject && filters.subject !== 'All') {
    params.subject = filters.subject;
  }
  if (filters?.priority && filters.priority !== 'All') {
    params.priority = filters.priority;
  }
  if (filters?.status && filters.status !== 'All') {
    params.status = filters.status;
  }
  if (filters?.date) {
    params.date = filters.date;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.sort) {
    params.sort = filters.sort;
  }

  const response = await apiClient.get<StudyPlansResponse>('/api/study-plans', {
    params,
  });

  return response.data.data;
};

/**
 * Fetch a single study plan by ID
 * GET /api/study-plans/:id
 */
export const getStudyPlanById = async (id: string): Promise<StudyPlan> => {
  const response = await apiClient.get<StudyPlanSingleResponse>(
    `/api/study-plans/${id}`
  );
  return response.data.data.studyPlan;
};

/**
 * Create a new study plan
 * POST /api/study-plans
 */
export const createStudyPlan = async (
  input: CreateStudyPlanInput
): Promise<StudyPlan> => {
  const response = await apiClient.post<StudyPlanSingleResponse>(
    '/api/study-plans',
    input
  );
  return response.data.data.studyPlan;
};

/**
 * Update an existing study plan
 * PUT /api/study-plans/:id
 */
export const updateStudyPlan = async (
  id: string,
  input: UpdateStudyPlanInput
): Promise<StudyPlan> => {
  const response = await apiClient.put<StudyPlanSingleResponse>(
    `/api/study-plans/${id}`,
    input
  );
  return response.data.data.studyPlan;
};

/**
 * Toggle status of a study plan (active <-> completed)
 * PATCH /api/study-plans/:id/status
 */
export const toggleStudyPlanStatus = async (
  id: string,
  status?: StudyPlanStatus
): Promise<StudyPlan> => {
  const response = await apiClient.patch<StudyPlanSingleResponse>(
    `/api/study-plans/${id}/status`,
    { status }
  );
  return response.data.data.studyPlan;
};

/**
 * Delete a study plan
 * DELETE /api/study-plans/:id
 */
export const deleteStudyPlan = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/study-plans/${id}`);
};

export default {
  getStudyPlans,
  getStudyPlanById,
  createStudyPlan,
  updateStudyPlan,
  toggleStudyPlanStatus,
  deleteStudyPlan,
};

