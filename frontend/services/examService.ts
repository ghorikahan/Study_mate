import apiClient from './api';
import {
  Exam,
  CreateExamInput,
  UpdateExamInput,
  ExamFilters,
  ExamsResponse,
  ExamSingleResponse,
} from '../types/exam';

const BASE = '/api/exams';

export const getExams = async (filters?: ExamFilters): Promise<ExamsResponse> => {
  const params: Record<string, string> = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.subject) params.subject = filters.subject;
  if (filters?.priority) params.priority = filters.priority;
  if (filters?.search) params.search = filters.search;

  const response = await apiClient.get<ExamsResponse>(BASE, { params });
  return response.data;
};

export const getExamById = async (id: string): Promise<ExamSingleResponse> => {
  const response = await apiClient.get<ExamSingleResponse>(`${BASE}/${id}`);
  return response.data;
};

export const createExam = async (input: CreateExamInput): Promise<ExamSingleResponse> => {
  const response = await apiClient.post<ExamSingleResponse>(BASE, input);
  return response.data;
};

export const updateExam = async (id: string, input: UpdateExamInput): Promise<ExamSingleResponse> => {
  const response = await apiClient.put<ExamSingleResponse>(`${BASE}/${id}`, input);
  return response.data;
};

export const toggleSyllabusTopic = async (
  examId: string,
  topicId: string
): Promise<ExamSingleResponse> => {
  const response = await apiClient.patch<ExamSingleResponse>(
    `${BASE}/${examId}/topics/${topicId}`
  );
  return response.data;
};

export const deleteExam = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`${BASE}/${id}`);
  return response.data;
};

export const examService = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  toggleSyllabusTopic,
  deleteExam,
};

export default examService;

