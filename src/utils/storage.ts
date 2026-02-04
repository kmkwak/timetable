import { ScheduleData } from '../types/schedule';
import { STORAGE_KEY, AUTH_KEY } from '../config/constants';

export function saveToStorage(data: ScheduleData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadFromStorage(): ScheduleData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ScheduleData;
  } catch {
    return null;
  }
}

export function saveAuthState(authenticated: boolean): void {
  if (authenticated) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function loadAuthState(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}
