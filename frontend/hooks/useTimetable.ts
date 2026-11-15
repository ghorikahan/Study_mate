import { useState, useEffect, useCallback } from 'react';
import {
  TimetableEntry,
  CreateTimetableInput,
  UpdateTimetableInput,
  WeeklyTimetableData,
  DaySchedule,
} from '../types/timetable';
import {
  getWeeklyTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '../services/timetableService';
import { extractErrorMessage } from '../services/authService';
import { useAuth } from '../context/AuthContext';

// ─── Week navigation helpers ──────────────────────────────────────────────────

/** Returns the Monday (UTC) of the week containing the given date */
export const getMondayOf = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Format Date → YYYY-MM-DD */
export const toDateString = (date: Date): string => date.toISOString().split('T')[0];

/** Add N days to a date */
export const addDays = (date: Date, n: number): Date => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** Get today's YYYY-MM-DD in UTC */
export const todayUTC = (): string => toDateString(new Date());

// ─── Hook return type ─────────────────────────────────────────────────────────
export interface UseTimetableReturn {
  weekData: WeeklyTimetableData | null;
  days: DaySchedule[];
  subjects: string[];
  selectedDate: string;
  weekStart: string;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  setSelectedDate: (date: string) => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  createEntry: (input: CreateTimetableInput) => Promise<TimetableEntry>;
  updateEntry: (id: string, input: UpdateTimetableInput) => Promise<TimetableEntry>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export const useTimetable = (): UseTimetableReturn => {
  const { isAuthenticated, token } = useAuth();

  const [weekStart, setWeekStart] = useState<string>(toDateString(getMondayOf(new Date())));
  const [selectedDate, setSelectedDate] = useState<string>(todayUTC());
  const [weekData, setWeekData] = useState<WeeklyTimetableData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch current week ─────────────────────────────────────────────────────
  const fetchWeek = useCallback(
    async (isPullToRefresh = false) => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await getWeeklyTimetable(weekStart);
        setWeekData(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, token, weekStart]
  );

  useEffect(() => {
    fetchWeek(false);
  }, [fetchWeek]);

  // ─── Week navigation ────────────────────────────────────────────────────────
  const goToPrevWeek = useCallback(() => {
    const prev = addDays(new Date(weekStart + 'T00:00:00Z'), -7);
    setWeekStart(toDateString(prev));
  }, [weekStart]);

  const goToNextWeek = useCallback(() => {
    const next = addDays(new Date(weekStart + 'T00:00:00Z'), 7);
    setWeekStart(toDateString(next));
  }, [weekStart]);

  const goToCurrentWeek = useCallback(() => {
    const today = new Date();
    setWeekStart(toDateString(getMondayOf(today)));
    setSelectedDate(todayUTC());
  }, []);

  const refresh = useCallback(async () => {
    await fetchWeek(true);
  }, [fetchWeek]);

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  const createEntry = useCallback(async (input: CreateTimetableInput): Promise<TimetableEntry> => {
    const entry = await createTimetableEntry(input);
    // Refetch silently to sync state
    fetchWeek(false);
    return entry;
  }, [fetchWeek]);

  const updateEntry = useCallback(async (id: string, input: UpdateTimetableInput): Promise<TimetableEntry> => {
    const entry = await updateTimetableEntry(id, input);
    fetchWeek(false);
    return entry;
  }, [fetchWeek]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    await deleteTimetableEntry(id);
    fetchWeek(false);
  }, [fetchWeek]);

  // ─── Derived values ─────────────────────────────────────────────────────────
  const days = weekData?.days ?? [];
  const subjects = weekData?.subjects ?? [];

  return {
    weekData,
    days,
    subjects,
    selectedDate,
    weekStart,
    loading,
    refreshing,
    error,
    setSelectedDate,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh,
  };
};

export default useTimetable;
