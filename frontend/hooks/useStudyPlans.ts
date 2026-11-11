import { useState, useEffect, useCallback } from 'react';
import {
  StudyPlan,
  CreateStudyPlanInput,
  UpdateStudyPlanInput,
  StudyPlanFilters,
  StudyPlanStatus,
} from '../types/studyPlan';
import {
  getStudyPlans,
  createStudyPlan,
  updateStudyPlan,
  toggleStudyPlanStatus,
  deleteStudyPlan,
} from '../services/studyPlanService';
import { extractErrorMessage } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export interface UseStudyPlansReturn {
  plans: StudyPlan[];
  subjects: string[];
  total: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filters: StudyPlanFilters;
  setFilters: (filters: Partial<StudyPlanFilters>) => void;
  createPlan: (input: CreateStudyPlanInput) => Promise<StudyPlan>;
  updatePlan: (id: string, input: UpdateStudyPlanInput) => Promise<StudyPlan>;
  toggleStatus: (id: string, status?: StudyPlanStatus) => Promise<StudyPlan>;
  deletePlan: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useStudyPlans = (
  initialFilters: StudyPlanFilters = {}
): UseStudyPlansReturn => {
  const { isAuthenticated, token } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilterState] = useState<StudyPlanFilters>(initialFilters);

  const fetchPlans = useCallback(
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
        const data = await getStudyPlans(filters);
        setPlans(data.studyPlans);
        setSubjects(data.subjects);
        setTotal(data.total);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        console.warn('[useStudyPlans] Failed to fetch plans:', msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, token, filters]
  );

  useEffect(() => {
    fetchPlans(false);
  }, [fetchPlans]);

  const setFilters = useCallback((newFilters: Partial<StudyPlanFilters>) => {
    setFilterState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchPlans(true);
  }, [fetchPlans]);

  const refetch = useCallback(async () => {
    await fetchPlans(false);
  }, [fetchPlans]);

  // ─── CRUD Handlers ──────────────────────────────────────────────────────────

  const handleCreatePlan = useCallback(
    async (input: CreateStudyPlanInput): Promise<StudyPlan> => {
      try {
        const newPlan = await createStudyPlan(input);
        // Prepend new plan to state
        setPlans((prev) => [newPlan, ...prev]);
        setTotal((prev) => prev + 1);
        if (newPlan.subject && !subjects.includes(newPlan.subject)) {
          setSubjects((prev) => [...prev, newPlan.subject].sort());
        }
        return newPlan;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    [subjects]
  );

  const handleUpdatePlan = useCallback(
    async (id: string, input: UpdateStudyPlanInput): Promise<StudyPlan> => {
      try {
        const updated = await updateStudyPlan(id, input);
        setPlans((prev) =>
          prev.map((plan) => (plan._id === id ? updated : plan))
        );
        return updated;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    []
  );

  const handleToggleStatus = useCallback(
    async (id: string, status?: StudyPlanStatus): Promise<StudyPlan> => {
      try {
        const updated = await toggleStudyPlanStatus(id, status);
        setPlans((prev) =>
          prev.map((plan) => (plan._id === id ? updated : plan))
        );
        return updated;
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    []
  );

  const handleDeletePlan = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteStudyPlan(id);
        setPlans((prev) => prev.filter((plan) => plan._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const msg = extractErrorMessage(err);
        throw new Error(msg);
      }
    },
    []
  );

  return {
    plans,
    subjects,
    total,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    toggleStatus: handleToggleStatus,
    deletePlan: handleDeletePlan,
    refresh,
    refetch,
  };
};

export default useStudyPlans;
