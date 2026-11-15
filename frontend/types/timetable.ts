// ─── Timetable Types (Day 9) ──────────────────────────────────────────────────

export type TimetableStatus = 'scheduled' | 'completed' | 'skipped';

export interface TimetableEntry {
  _id: string;
  user: string;
  subject: string;
  topic: string;
  date: string; // ISO date string (midnight UTC)
  dayOfWeek: number; // 0 = Sun … 6 = Sat
  dayName: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  durationMinutes: number;
  timeRange: string; // virtual: "09:00 – 10:30"
  color: string;     // hex
  notes: string;
  isRecurring: boolean;
  recurringDays: number[];
  status: TimetableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DaySchedule {
  date: string;      // YYYY-MM-DD
  dayName: string;
  totalMinutes: number;
  entryCount: number;
  entries: TimetableEntry[];
}

export interface WeeklyTimetableData {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  totalWeekMinutes: number;
  totalWeekHours: number;
  subjects: string[];
  days: DaySchedule[];
  total: number;
}

export interface DayTimetableData {
  date: string;
  dayName: string;
  totalMinutes: number;
  totalHours: number;
  entries: TimetableEntry[];
  total: number;
}

export interface CreateTimetableInput {
  subject: string;
  topic?: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  color?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
}

export interface UpdateTimetableInput {
  subject?: string;
  topic?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  status?: TimetableStatus;
}

export interface TimetableFilters {
  weekStart?: string;  // YYYY-MM-DD
  subject?: string;
}

// API response shapes
export interface WeeklyTimetableResponse {
  success: boolean;
  message: string;
  data: WeeklyTimetableData;
}

export interface DayTimetableResponse {
  success: boolean;
  message: string;
  data: DayTimetableData;
}

export interface TimetableEntryResponse {
  success: boolean;
  message: string;
  data: { entry: TimetableEntry };
}

