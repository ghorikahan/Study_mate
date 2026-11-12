import apiClient from './api';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TasksResponse,
  TaskSingleResponse,
  TaskCounts,
  TaskStatus,
} from '../types/task';

/**
 * Fetch all tasks with optional filters
 * GET /api/tasks
 */
export const getTasks = async (
  filters?: TaskFilters
): Promise<{ tasks: Task[]; total: number; counts: TaskCounts; subjects: string[] }> => {
  const params: Record<string, string> = {};

  if (filters?.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters?.priority && filters.priority !== 'All') {
    params.priority = filters.priority;
  }
  if (filters?.subject && filters.subject !== 'All') {
    params.subject = filters.subject;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.sort) {
    params.sort = filters.sort;
  }

  const response = await apiClient.get<TasksResponse>('/api/tasks', { params });
  return response.data.data;
};

/**
 * Fetch a single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (id: string): Promise<Task> => {
  const response = await apiClient.get<TaskSingleResponse>(`/api/tasks/${id}`);
  return response.data.data.task;
};

/**
 * Create a new task
 * POST /api/tasks
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const response = await apiClient.post<TaskSingleResponse>('/api/tasks', input);
  return response.data.data.task;
};

/**
 * Update an existing task
 * PUT /api/tasks/:id
 */
export const updateTask = async (
  id: string,
  input: UpdateTaskInput
): Promise<Task> => {
  const response = await apiClient.put<TaskSingleResponse>(`/api/tasks/${id}`, input);
  return response.data.data.task;
};

/**
 * Toggle task status (pending <-> completed)
 * PATCH /api/tasks/:id/toggle
 */
export const toggleTaskStatus = async (
  id: string,
  status?: TaskStatus
): Promise<Task> => {
  const response = await apiClient.patch<TaskSingleResponse>(
    `/api/tasks/${id}/toggle`,
    { status }
  );
  return response.data.data.task;
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tasks/${id}`);
};

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
};

