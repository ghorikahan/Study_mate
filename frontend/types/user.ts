import { User, UserPreferences } from './auth';

export interface UserStats {
  plansCount: number;
  tasksCount: number;
  completedTasksCount: number;
  examsCount: number;
  sessionsCount: number;
  totalStudyHours: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    stats: UserStats;
  };
}

export interface UserProfileUpdateInput {
  name?: string;
  bio?: string;
  institution?: string;
  avatar?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UpdatePreferencesInput {
  theme?: 'dark' | 'light' | 'system';
  weeklyStudyGoalHours?: number;
  dailyStudyGoalMinutes?: number;
  defaultFocusMinutes?: number;
  notifications?: {
    email?: boolean;
    push?: boolean;
    examReminders?: boolean;
    dailyPlanSummary?: boolean;
    taskReminders?: boolean;
    soundEnabled?: boolean;
  };
}

export interface DeleteAccountInput {
  password: string;
  confirmationText: string;
}

export interface CascadeSummary {
  plansDeleted: number;
  tasksDeleted: number;
  examsDeleted: number;
  sessionsDeleted: number;
  timetableDeleted: number;
  notificationsDeleted: number;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data: {
    deletedAt: string;
    cascadeSummary: CascadeSummary;
  };
}

