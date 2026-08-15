import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

const environmentUrl = process.env.EXPO_PUBLIC_API_URL;
const releaseUrl = Constants.expoConfig?.extra?.apiUrl;
const localEnvironmentUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(environmentUrl || '');
const configuredUrl = __DEV__ && (Platform.OS === 'web' || !localEnvironmentUrl)
  ? environmentUrl || releaseUrl
  : releaseUrl || environmentUrl;
export const API_URL = String(configuredUrl || 'https://www.harvestnearu.com').replace(/\/$/, '');
const SESSION_KEY = 'harvestnearu.native.session-token';

export const saveSessionToken = (token?: string | null) => token
  ? AsyncStorage.setItem(SESSION_KEY, token)
  : Promise.reject(new Error('The server did not provide a mobile session. Update the HarvestNearU backend and try again.'));
export const clearSessionToken = () => AsyncStorage.removeItem(SESSION_KEY);

export function absoluteUrl(value?: string | null) {
  if (!value) return `${API_URL}/produce/vine-ripe-tomatoes.webp`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function multipartFile(uri: string) {
  return new File(uri);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem(SESSION_KEY);
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
    if (response.status === 404) throw new Error('This feature is waiting for the latest server update. Please try again shortly.');
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
