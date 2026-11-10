import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types/auth';

const TOKEN_KEY = 'studymate_auth_token';
const USER_KEY = 'studymate_auth_user';

// In-memory fallback for platforms or environments where SecureStore is unavailable
const memoryFallback = new Map<string, string>();

/**
 * Helper to check if SecureStore is available on the current platform
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Store a string key-value pair securely
 */
const setItem = async (key: string, value: string): Promise<void> => {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (error) {
    console.warn(`[Storage] SecureStore setItem failed for key "${key}", falling back:`, error);
  }

  // Fallback to localStorage on Web if available, else memory
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {}
  }
  memoryFallback.set(key, value);
};

/**
 * Retrieve a string value by key
 */
const getItem = async (key: string): Promise<string | null> => {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.warn(`[Storage] SecureStore getItem failed for key "${key}", falling back:`, error);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {}
  }
  return memoryFallback.get(key) || null;
};

/**
 * Delete a key from secure storage
 */
const deleteItem = async (key: string): Promise<void> => {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch (error) {
    console.warn(`[Storage] SecureStore deleteItem failed for key "${key}", falling back:`, error);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch {}
  }
  memoryFallback.delete(key);
};

// ─── Token Management ─────────────────────────────────────────────────────────

export const saveToken = async (token: string): Promise<void> => {
  await setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await getItem(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await deleteItem(TOKEN_KEY);
};

// ─── User Management ──────────────────────────────────────────────────────────

export const saveUser = async (user: User): Promise<void> => {
  await setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const data = await getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await deleteItem(USER_KEY);
};

// ─── Clear All Auth Data ──────────────────────────────────────────────────────

export const clearAuthStorage = async (): Promise<void> => {
  await Promise.all([removeToken(), removeUser()]);
};

export default {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser,
  clearAuthStorage,
};
