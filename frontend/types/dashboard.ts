export interface TodayTask {
  _id: string;
  title: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: string;
  estimatedMinutes: number;
}

export interface UpcomingExam {
  _id: string;
  examTitle: string;
  subject: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  daysRemaining: number;
  syllabusProgressPercent: number;
  priority?: string;
  targetScore?: number;
}

export interface DailyStudyItem {
  date: string;
  day: string;
  minutes: number;
  hours: number;
  isToday: boolean;
}

export interface DashboardSummary {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    studyStreak: number;
    weeklyGoalHours: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    todayTasks: TodayTask[];
    completionRate: number;
  };
  studyTime: {
    todayMinutes: number;
    todayHours: number;
    weekMinutes: number;
    weekHours: number;
    totalHours: number;
    weeklyGoalHours: number;
    weeklyProgressPercent: number;
    weeklyBreakdown: DailyStudyItem[];
  };
  exams: {
    totalUpcoming: number;
    nextExam: UpcomingExam | null;
    upcoming: UpcomingExam[];
  };
  plans: {
    activeCount: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardSummary;
  timestamp?: string;
}

