export type ExamStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
export type ExamPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface SyllabusTopic {
  _id: string;
  topicName: string;
  isCovered: boolean;
}

export interface Exam {
  _id: string;
  user: string;
  examTitle: string;
  subject: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  seatNumber: string;
  targetScore: number | null;
  actualScore: number | null;
  priority: ExamPriority;
  status: ExamStatus;
  syllabusTopics: SyllabusTopic[];
  notes: string;
  daysRemaining: number;
  syllabusProgressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  examTitle: string;
  subject: string;
  examDate: string;
  startTime?: string;
  durationMinutes?: number;
  location?: string;
  seatNumber?: string;
  targetScore?: number | null;
  priority?: ExamPriority;
  syllabusTopics?: { topicName: string; isCovered?: boolean }[];
  notes?: string;
}

export interface UpdateExamInput extends Partial<CreateExamInput> {
  status?: ExamStatus;
  actualScore?: number | null;
}

export interface ExamFilters {
  status?: string;
  subject?: string;
  priority?: string;
  search?: string;
}

export interface ExamCounts {
  total: number;
  upcoming: number;
  thisWeek: number;
  past: number;
}

export interface ExamsResponse {
  success: boolean;
  message: string;
  data: {
    exams: Exam[];
    total: number;
    subjects: string[];
    counts: ExamCounts;
  };
}

export interface ExamSingleResponse {
  success: boolean;
  message: string;
  data: { exam: Exam };
}

