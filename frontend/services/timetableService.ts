import api from './api';
import {
  TimetableEntry,
  CreateTimetableInput,
  UpdateTimetableInput,
  WeeklyTimetableData,
  DayTimetableData,
} from '../types/timetable';

// ─── Get weekly timetable ──────────────────────────────────────────────────────
export const getWeeklyTimetable = async (weekStart?: string): Promise<WeeklyTimetableData> => {
  const params: Record<string, string> = {};
  if (weekStart) params.weekStart = weekStart;
  const res = await api.get('/api/timetable', { params });
  return res.data.data as WeeklyTimetableData;
};

// ─── Get single-day timetable ──────────────────────────────────────────────────
export const getDayTimetable = async (date: string): Promise<DayTimetableData> => {
  const res = await api.get('/api/timetable/day', { params: { date } });
  return res.data.data as DayTimetableData;
};

// ─── Get single entry ─────────────────────────────────────────────────────────
export const getTimetableEntryById = async (id: string): Promise<TimetableEntry> => {
  const res = await api.get(`/api/timetable/${id}`);
  return res.data.data.entry as TimetableEntry;
};

// ─── Create entry ─────────────────────────────────────────────────────────────
export const createTimetableEntry = async (input: CreateTimetableInput): Promise<TimetableEntry> => {
  const res = await api.post('/api/timetable', input);
  return res.data.data.entry as TimetableEntry;
};

// ─── Update entry ─────────────────────────────────────────────────────────────
export const updateTimetableEntry = async (
  id: string,
  input: UpdateTimetableInput
): Promise<TimetableEntry> => {
  const res = await api.put(`/api/timetable/${id}`, input);
  return res.data.data.entry as TimetableEntry;
};

// ─── Delete entry ─────────────────────────────────────────────────────────────
export const deleteTimetableEntry = async (id: string): Promise<void> => {
  await api.delete(`/api/timetable/${id}`);
};

