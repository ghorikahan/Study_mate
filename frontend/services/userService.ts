import apiClient from './api';
import {
  UserProfileResponse,
  UserProfileUpdateInput,
  ChangePasswordInput,
  UpdatePreferencesInput,
  DeleteAccountInput,
  DeleteAccountResponse,
} from '../types/user';
import { User } from '../types/auth';
import { extractErrorMessage } from './authService';

export const userService = {
  /**
   * Fetch user profile along with aggregated study statistics
   */
  getProfile: async (): Promise<UserProfileResponse['data']> => {
    try {
      const response = await apiClient.get<UserProfileResponse>('/api/users/profile');
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Update editable profile details (name, bio, institution, avatar)
   */
  updateProfile: async (data: UserProfileUpdateInput): Promise<User> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; data: { user: User } }>(
        '/api/users/profile',
        data
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Change user password securely
   */
  changePassword: async (data: ChangePasswordInput): Promise<string> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string }>(
        '/api/users/password',
        data
      );
      return response.data.message || 'Password changed successfully.';
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Update study goals and notification preferences
   */
  updatePreferences: async (data: UpdatePreferencesInput): Promise<User> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; data: { user: User } }>(
        '/api/users/preferences',
        data
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Permanently delete user account and all related study records
   */
  deleteAccount: async (data: DeleteAccountInput): Promise<DeleteAccountResponse['data']> => {
    try {
      const response = await apiClient.delete<DeleteAccountResponse>('/api/users/account', {
        data,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default userService;

