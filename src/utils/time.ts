import { TIME_START, TIME_END, TIME_SLOT_MINUTES } from '../config/constants';

// 분을 시:분 문자열로 변환
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

// 시:분 문자열을 분으로 변환
export function timeStringToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
}

// 10분 단위로 스냅
export function snapToSlot(minutes: number): number {
  return Math.round(minutes / TIME_SLOT_MINUTES) * TIME_SLOT_MINUTES;
}

// 시간표 범위 내로 제한
export function clampTime(minutes: number): number {
  const minTime = TIME_START * 60;
  const maxTime = TIME_END * 60;
  return Math.max(minTime, Math.min(maxTime, minutes));
}

// 시간대의 총 분 수
export function getTotalMinutes(): number {
  return (TIME_END - TIME_START) * 60;
}

// 분을 픽셀 위치로 변환 (컨테이너 높이 기준)
export function minutesToPixels(minutes: number, containerHeight: number): number {
  const startMinutes = TIME_START * 60;
  const totalMinutes = getTotalMinutes();
  return ((minutes - startMinutes) / totalMinutes) * containerHeight;
}

// 픽셀 위치를 분으로 변환
export function pixelsToMinutes(pixels: number, containerHeight: number): number {
  const startMinutes = TIME_START * 60;
  const totalMinutes = getTotalMinutes();
  const minutes = (pixels / containerHeight) * totalMinutes + startMinutes;
  return snapToSlot(clampTime(minutes));
}

// UUID 생성
export function generateId(): string {
  return crypto.randomUUID();
}
