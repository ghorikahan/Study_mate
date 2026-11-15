import { useState, useCallback, useEffect } from 'react';
import {
  Exam,
  ExamCounts,
  ExamFilters,
  CreateExamInput,
  UpdateExamInput,
} from '../types/exam';
import examService from '../services/examService';

interface UseExamsReturn {
  exams: Exam[];
  counts: ExamCounts;
  subjects: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filters: ExamFilters;
  setFilters: (filters: ExamFilters) => void;
  createExam: (input: CreateExamInput) => Promise<Exam>;
  updateExam: (id: string, input: UpdateExamInput) => Promise<Exam>;
  toggleTopic: (examId: string, topicId: string) => Promise<Exam>;
  deleteExam: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

const DEFAULT_COUNTS: ExamCounts = { total: 0, upcoming: 0, thisWeek: 0, past: 0 };

export const useExams = (initialFilters: ExamFilters = {}): UseExamsReturn => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [counts, setCounts] = useState<ExamCounts>(DEFAULT_COUNTS);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExamFilters>(initialFilters);

  const fetchExams = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const response = await examService.getExams(filters);
        if (response.success) {
          setExams(response.data.exams);
          setCounts(response.data.counts);
          setSubjects(response.data.subjects);
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to load exams'
            : 'Failed to load exams';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const createExam = useCallback(async (input: CreateExamInput): Promise<Exam> => {
    const response = await examService.createExam(input);
    if (!response.success) throw new Error(response.message);
    setExams((prev) => [response.data.exam, ...prev]);
    setCounts((c) => ({ ...c, total: c.total + 1, upcoming: c.upcoming + 1 }));
    return response.data.exam;
  }, []);

  const updateExam = useCallback(async (id: string, input: UpdateExamInput): Promise<Exam> => {
    const response = await examService.updateExam(id, input);
    if (!response.success) throw new Error(response.message);
    setExams((prev) => prev.map((e) => (e._id === id ? response.data.exam : e)));
    return response.data.exam;
  }, []);

  const toggleTopic = useCallback(async (examId: string, topicId: string): Promise<Exam> => {
    const response = await examService.toggleSyllabusTopic(examId, topicId);
    if (!response.success) throw new Error(response.message);
    setExams((prev) => prev.map((e) => (e._id === examId ? response.data.exam : e)));
    return response.data.exam;
  }, []);

  const deleteExam = useCallback(async (id: string): Promise<void> => {
    await examService.deleteExam(id);
    setExams((prev) => prev.filter((e) => e._id !== id));
    setCounts((c) => ({ ...c, total: Math.max(0, c.total - 1) }));
  }, []);

  const refresh = useCallback(() => fetchExams(true), [fetchExams]);
  const refetch = useCallback(() => fetchExams(false), [fetchExams]);

  return {
    exams,
    counts,
    subjects,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    createExam,
    updateExam,
    toggleTopic,
    deleteExam,
    refresh,
    refetch,
  };
};

export default useExams;

