export type SessionType = 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch' | 'manual';

export interface StudySession {
  _id: string;
  user: string;
  subject: string;
  title: string;
  sessionType: SessionType;
  durationMinutes: number;
  startTime: string;
  endTime: string | null;
  focusRating: number;
  notes: string;
  isCompleted: boolean;
  clientSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudySessionInput {
  subject: string;
  durationMinutes: number;
  sessionType?: SessionType;
  startTime?: string;
  endTime?: string;
  title?: string;
  notes?: string;
  focusRating?: number;
  clientSessionId?: string;
  isCompleted?: boolean;
}

export interface StudySessionStats {
  todayMinutes: number;
  todayHours: number;
  todaySessions: number;
  todayPomodoros: number;
  totalMinutes: number;
  totalHours: number;
  totalPomodoros: number;
  currentStreak: number;
  longestStreak: number;
}

export interface StudySessionsResponse {
  success: boolean;
  message: string;
  data: {
    sessions: StudySession[];
    total: number;
    page: number;
    pages: number;
    subjects: string[];
    summary: {
      totalMinutes: number;
      totalHours: number;
      totalSessions: number;
      avgRating: number;
    };
  };
}

export interface StudySessionStatsResponse {
  success: boolean;
  message: string;
  data: StudySessionStats;
}

export interface StudySessionSingleResponse {
  success: boolean;
  message: string;
  data: {
    studySession: StudySession;
    isDuplicate?: boolean;
  };
}

export interface StudySessionFilters {
  subject?: string;
  sessionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
