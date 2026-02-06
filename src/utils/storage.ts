import { ScheduleListData } from '../types/schedule';
import { STORAGE_KEY } from '../config/constants';

export function saveToStorage(data: ScheduleListData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadFromStorage(): ScheduleListData | Record<string, unknown> | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
