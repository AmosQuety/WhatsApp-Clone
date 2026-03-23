import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Unified storage utility to handle platform-specific storage.
 * On Web: Falls back to localStorage to avoid ExpoSecureStore native module errors.
 * On Native: Uses expo-secure-store for encrypted storage.
 */
export const AuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing from localStorage:', e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};
