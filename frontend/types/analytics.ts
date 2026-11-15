export interface DailyBreakdownItem {
  date: string;
  dayName: string;
  shortDate: string;
  minutes: number;
  hours: number;
  sessions: number;
  tasksCompleted: number;
}

export interface SubjectDistributionItem {
  subject: string;
  minutes: number;
  hours: number;
  percentage: number;
  sessionsCount: number;
  avgRating: number;
  color: string;
}

export interface AnalyticsOverviewData {
  timeRange: '7d' | '30d' | 'all';
  daysCount: number;
  studyTime: {
    totalMinutes: number;
    totalHours: number;
    dailyAverageHours: number;
    weeklyGoalHours: number;
    goalProgressPercent: number;
    dailyBreakdown: DailyBreakdownItem[];
  };
  taskMetrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  subjectDistribution: SubjectDistributionItem[];
  focusMetrics: {
    totalSessions: number;
    pomodorosCompleted: number;
    avgFocusRating: number;
    totalFocusHours: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
  };
  monthlyProgress: {
    monthMinutes: number;
    monthHours: number;
    monthlyGoalHours: number;
    monthlyProgressPercent: number;
  };
  productivityScore: number;
  examsCount: {
    total: number;
    upcoming: number;
  };
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  message: string;
  data: AnalyticsOverviewData;
}

