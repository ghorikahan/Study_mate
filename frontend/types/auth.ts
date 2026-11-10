export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  weeklyStudyGoalHours: number;
  notificationsEnabled?: boolean;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string | null;
  studyStreak?: number;
  preferences?: UserPreferences;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
  timestamp?: string;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
  timestamp?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
