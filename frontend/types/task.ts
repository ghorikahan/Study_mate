export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface Task {
  _id: string;
  id?: string;
  user: string;
  studyPlan?: string | null;
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  isCompleted: boolean;
  completedAt?: string | null;
  isOverdue?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCounts {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export interface CreateTaskInput {
  title: string;
  subject: string;
  dueDate: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  description?: string;
  studyPlan?: string | null;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  subject?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  actualMinutes?: number;
  description?: string;
  studyPlan?: string | null;
  tags?: string[];
}

export interface TaskFilters {
  status?: 'all' | 'pending' | 'completed' | 'overdue' | 'in-progress';
  priority?: string;
  subject?: string;
  search?: string;
  sort?: string;
}

export interface TasksResponse {
  success: boolean;
  message: string;
  data: {
    tasks: Task[];
    total: number;
    counts: TaskCounts;
    subjects: string[];
  };
  timestamp?: string;
}

export interface TaskSingleResponse {
  success: boolean;
  message: string;
  data: {
    task: Task;
  };
  timestamp?: string;
}

