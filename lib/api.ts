import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const environmentUrl = process.env.EXPO_PUBLIC_API_URL;
const releaseUrl = Constants.expoConfig?.extra?.apiUrl;
const localEnvironmentUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(environmentUrl || '');
const configuredUrl = __DEV__ && (Platform.OS === 'web' || !localEnvironmentUrl)
  ? environmentUrl || releaseUrl
  : releaseUrl || environmentUrl;
export const API_URL = String(configuredUrl || 'https://www.harvestnearu.com').replace(/\/$/, '');
const SESSION_KEY = 'harvestnearu.native.session-token';
// The session token is a bearer credential with a long life, so it belongs in the platform keystore
// rather than in AsyncStorage, which is an unencrypted file inside the app sandbox. SecureStore has
// no web implementation, so the browser build keeps using AsyncStorage.
const keystoreAvailable = Platform.OS !== 'web';

async function readSessionToken() {
  if (!keystoreAvailable) return AsyncStorage.getItem(SESSION_KEY);
  const stored = await SecureStore.getItemAsync(SESSION_KEY).catch(() => null);
  if (stored) return stored;
  // Tokens issued before the keystore was used are moved across on first read, so upgrading the app
  // does not sign anyone out.
  const legacy = await AsyncStorage.getItem(SESSION_KEY);
  if (!legacy) return null;
  await SecureStore.setItemAsync(SESSION_KEY, legacy).catch(() => undefined);
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
  return legacy;
}

export async function saveSessionToken(token?: string | null) {
  if (!token) throw new Error('The server did not provide a mobile session. Update the HarvestNearU backend and try again.');
  if (!keystoreAvailable) { await AsyncStorage.setItem(SESSION_KEY, token); return; }
  await SecureStore.setItemAsync(SESSION_KEY, token);
  // Clear any pre-keystore copy so the token is not left sitting in plain storage as well.
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
}

export async function clearSessionToken() {
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
  if (keystoreAvailable) await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
}

export function absoluteUrl(value?: string | null) {
  if (!value) return `${API_URL}/produce/vine-ripe-tomatoes.webp`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function multipartFile(uri: string) {
  return new File(uri);
}

/** Carries the HTTP status so callers can tell a refusal from a request that never completed. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await readSessionToken();
  const requestInit = {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', 'X-HarvestNearU-Client': 'mobile', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init?.headers },
  } satisfies RequestInit;
  let response: Response;
  try {
    response = await expoFetch(`${API_URL}${path}`, requestInit);
  } catch (error) {
    const fallbackUrl = String(releaseUrl || '').replace(/\/$/, '');
    if (!fallbackUrl || fallbackUrl === API_URL) throw error;
    response = await expoFetch(`${fallbackUrl}${path}`, requestInit);
  }
  const text = await response.text();
  let data: T & { error?: string };
  try { data = text ? JSON.parse(text) : ({} as T & { error?: string }); }
  catch {
    if (response.status === 404) throw new ApiError('This feature is waiting for the latest server update. Please try again shortly.', 404);
    throw new ApiError(`The server returned an unreadable response (${response.status}).`, response.status);
  }
  if (!response.ok) throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  return data;
}
