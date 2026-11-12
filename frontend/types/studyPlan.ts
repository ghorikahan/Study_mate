export type StudyPlanPriority = 'low' | 'medium' | 'high' | 'urgent';
export type StudyPlanStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Milestone {
  _id?: string;
  title: string;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface StudyPlan {
  _id: string;
  id?: string;
  user: string;
  subject: string;
  topic: string;
  title?: string;
  description?: string;
  date: string;
  startDate?: string;
  targetCompletionDate?: string;
  startTime: string;
  duration: number; // in minutes
  priority: StudyPlanPriority;
  status: StudyPlanStatus;
  color?: string;
  totalEstimatedHours?: number;
  completedHours?: number;
  progressPercent?: number;
  milestones?: Milestone[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudyPlanInput {
  subject: string;
  topic: string;
  title?: string;
  date: string;
  startTime?: string;
  duration?: number;
  priority?: StudyPlanPriority;
  description?: string;
  color?: string;
  status?: StudyPlanStatus;
}

export interface UpdateStudyPlanInput {
  subject?: string;
  topic?: string;
  title?: string;
  date?: string;
  startTime?: string;
  duration?: number;
  priority?: StudyPlanPriority;
  status?: StudyPlanStatus;
  description?: string;
  color?: string;
  completedHours?: number;
}

export interface StudyPlanFilters {
  subject?: string;
  priority?: string;
  status?: string;
  date?: string;
  search?: string;
  sort?: string;
}

export interface StudyPlansResponse {
  success: boolean;
  message: string;
  data: {
    studyPlans: StudyPlan[];
    total: number;
    subjects: string[];
  };
  timestamp?: string;
}

export interface StudyPlanSingleResponse {
  success: boolean;
  message: string;
  data: {
    studyPlan: StudyPlan;
  };
  timestamp?: string;
}

