import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

async function isSecureStoreAvailable() {
  if (Platform.OS === 'web') return false;
  try { return await SecureStore.isAvailableAsync(); }
  catch { return false; }
}

export async function saveToken(token: string) {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== 'undefined' && window?.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
