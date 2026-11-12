import { useState, useEffect, useCallback } from 'react';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskCounts,
  TaskStatus,
} from '../types/task';
import {
  getTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
} from '../services/taskService';
import { extractErrorMessage } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export interface UseTasksReturn {
  tasks: Task[];
  counts: TaskCounts;
  subjects: string[];
  total: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filters: TaskFilters;
  setFilters: (filters: Partial<TaskFilters>) => void;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  toggleStatus: (id: string, status?: TaskStatus) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useTasks = (initialFilters: TaskFilters = {}): UseTasksReturn => {
  const { isAuthenticated, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilterState] = useState<TaskFilters>(initialFilters);

  const fetchTasks = useCallback(
    async (isPullToRefresh = false) => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getTasks(filters);
        setTasks(data.tasks);
        setCounts(data.counts);
        setSubjects(data.subjects);
        setTotal(data.total);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        console.warn('[useTasks] Failed to fetch tasks:', msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, token, filters]
  );

  useEffect(() => {
    fetchTasks(false);
  }, [fetchTasks]);

  const setFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilterState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchTasks(true);
  }, [fetchTasks]);

  const refetch = useCallback(async () => {
    await fetchTasks(false);
  }, [fetchTasks]);

  // ─── CRUD Handlers ──────────────────────────────────────────────────────────

  const handleCreateTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      try {
        const newTask = await createTask(input);
        setTasks((prev) => [newTask, ...prev]);
        setCounts((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: newTask.status === 'completed' ? prev.pending : prev.pending + 1,
          completed: newTask.status === 'completed' ? prev.completed + 1 : prev.completed,
          overdue: newTask.isOverdue ? prev.overdue + 1 : prev.overdue,
        }));
        if (newTask.subject && !subjects.includes(newTask.subject)) {
          setSubjects((prev) => [...prev, newTask.subject].sort());
        }
        return newTask;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    [subjects]
  );

  const handleUpdateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task> => {
      try {
        const updated = await updateTask(id, input);
        setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
        // Refetch counts to keep metrics consistent
        await fetchTasks(false);
        return updated;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    [fetchTasks]
  );

  const handleToggleStatus = useCallback(
    async (id: string, status?: TaskStatus): Promise<Task> => {
      try {
        const updated = await toggleTaskStatus(id, status);
        setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
        // Update counts optimistically
        setCounts((prev) => {
          const wasCompleted = updated.status !== 'completed';
          return {
            ...prev,
            pending: wasCompleted ? Math.max(0, prev.pending - 1) : prev.pending + 1,
            completed: wasCompleted ? prev.completed + 1 : Math.max(0, prev.completed - 1),
          };
        });
        return updated;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    []
  );

  const handleDeleteTask = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t._id !== id));
        setCounts((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    []
  );

  return {
    tasks,
    counts,
    subjects,
    total,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    toggleStatus: handleToggleStatus,
    deleteTask: handleDeleteTask,
    refresh,
    refetch,
  };
};

export default useTasks;

