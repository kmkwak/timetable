import { useState, useCallback, useEffect } from 'react';
import { ScheduleData, ScheduleBlock, ScheduleListData } from '../types/schedule';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { fetchFromGitHub, saveToGitHub, isGitHubTokenConfigured } from '../utils/github';
import { generateId } from '../utils/time';
import { COLOR_KEYS, TIME_START, TIME_END } from '../config/constants';

// 두 시간 범위가 겹치는지 확인
function isOverlapping(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

// 해당 요일에서 겹치지 않는 시간을 찾기
function findNonOverlappingTime(
  blocks: ScheduleBlock[],
  day: number,
  preferredStart: number,
  duration: number
): { startTime: number; endTime: number } | null {
  const dayBlocks = blocks
    .filter((b) => b.day === day)
    .sort((a, b) => a.startTime - b.startTime);

  const minTime = TIME_START * 60;
  const maxTime = TIME_END * 60;

  // 먼저 원하는 시간이 가능한지 확인
  const preferredEnd = preferredStart + duration;
  if (preferredStart >= minTime && preferredEnd <= maxTime) {
    const hasOverlap = dayBlocks.some((b) =>
      isOverlapping(preferredStart, preferredEnd, b.startTime, b.endTime)
    );
    if (!hasOverlap) {
      return { startTime: preferredStart, endTime: preferredEnd };
    }
  }

  // 원하는 시간대 근처에서 빈 공간 찾기
  const gaps: { start: number; end: number }[] = [];

  if (dayBlocks.length === 0) {
    return {
      startTime: Math.max(minTime, preferredStart),
      endTime: Math.min(maxTime, Math.max(minTime, preferredStart) + duration),
    };
  }

  if (dayBlocks[0].startTime > minTime) {
    gaps.push({ start: minTime, end: dayBlocks[0].startTime });
  }

  for (let i = 0; i < dayBlocks.length - 1; i++) {
    if (dayBlocks[i].endTime < dayBlocks[i + 1].startTime) {
      gaps.push({ start: dayBlocks[i].endTime, end: dayBlocks[i + 1].startTime });
    }
  }

  if (dayBlocks[dayBlocks.length - 1].endTime < maxTime) {
    gaps.push({ start: dayBlocks[dayBlocks.length - 1].endTime, end: maxTime });
  }

  let bestGap: { start: number; end: number } | null = null;
  let bestDistance = Infinity;

  for (const gap of gaps) {
    if (gap.end - gap.start >= duration) {
      const gapCenter = (gap.start + gap.end) / 2;
      const distance = Math.abs(gapCenter - (preferredStart + duration / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestGap = gap;
      }
    }
  }

  if (bestGap) {
    let startTime = preferredStart;
    if (startTime < bestGap.start) {
      startTime = bestGap.start;
    } else if (startTime + duration > bestGap.end) {
      startTime = bestGap.end - duration;
    }
    return { startTime, endTime: startTime + duration };
  }

  return null;
}

const initialListData: ScheduleListData = {
  schedules: [],
};

export function useSchedule() {
  const [listData, setListData] = useState<ScheduleListData>(initialListData);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isEditMode, setIsEditMode] = useState(false);

  // 토큰이 있으면 편집 가능
  const canEdit = isGitHubTokenConfigured();

  // 현재 선택된 시간표
  const currentSchedule = currentScheduleId
    ? listData.schedules.find((s) => s.id === currentScheduleId) || null
    : null;

  // 초기 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setSyncStatus('syncing');

      // GitHub에서 먼저 시도 (공개 읽기 - 토큰 없이도 가능)
      const githubData = await fetchFromGitHub();
      if (githubData) {
        setListData(githubData);
        saveToStorage(githubData); // 로컬에도 캐시
        setSyncStatus('success');
        setIsLoading(false);
        return;
      }

      // GitHub 실패 시 로컬 스토리지 사용
      setSyncStatus('error');
      const savedData = loadFromStorage();

      if (savedData) {
        // 기존 단일 시간표 데이터를 새 형식으로 마이그레이션
        if ('blocks' in savedData && !('schedules' in savedData)) {
          const oldData = savedData as { blocks: ScheduleBlock[]; title: string };
          const migratedSchedule: ScheduleData = {
            id: generateId(),
            title: oldData.title || '시간표',
            blocks: oldData.blocks || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const localData: ScheduleListData = {
            schedules: [migratedSchedule],
          };
          setListData(localData);
          saveToStorage(localData);
        } else if ('schedules' in savedData) {
          setListData(savedData as ScheduleListData);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // 편집 모드 진입
  const enterEditMode = useCallback(() => {
    if (canEdit) {
      setIsEditMode(true);
    }
  }, [canEdit]);

  // 편집 모드 종료 (저장 후)
  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  // 편집 취소 (변경사항 버리고 다시 로드)
  const cancelEdit = useCallback(async () => {
    setIsEditMode(false);
    setHasChanges(false);

    // GitHub에서 다시 로드
    const githubData = await fetchFromGitHub();
    if (githubData) {
      setListData(githubData);
      saveToStorage(githubData);
    } else {
      // GitHub 실패 시 로컬에서 로드
      const savedData = loadFromStorage();
      if (savedData && 'schedules' in savedData) {
        setListData(savedData as ScheduleListData);
      }
    }
  }, []);

  // 저장
  const save = useCallback(async () => {
    saveToStorage(listData);

    // GitHub 동기화
    if (isGitHubTokenConfigured()) {
      setSyncStatus('syncing');
      const success = await saveToGitHub(listData);
      setSyncStatus(success ? 'success' : 'error');
    }

    setHasChanges(false);
  }, [listData]);

  // 자동 저장
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        save();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasChanges, save]);

  // 새 시간표 생성
  const createSchedule = useCallback((title: string): ScheduleData => {
    const newSchedule: ScheduleData = {
      id: generateId(),
      title,
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setListData((prev) => ({
      schedules: [...prev.schedules, newSchedule],
    }));
    setHasChanges(true);

    return newSchedule;
  }, []);

  // 시간표 삭제
  const deleteSchedule = useCallback((id: string) => {
    setListData((prev) => ({
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
    if (currentScheduleId === id) {
      setCurrentScheduleId(null);
    }
    setHasChanges(true);
  }, [currentScheduleId]);

  // 시간표 복사
  const copySchedule = useCallback((id: string): ScheduleData | null => {
    const sourceSchedule = listData.schedules.find((s) => s.id === id);
    if (!sourceSchedule) return null;

    const copiedSchedule: ScheduleData = {
      ...sourceSchedule,
      id: generateId(),
      title: `${sourceSchedule.title} (복사본)`,
      blocks: sourceSchedule.blocks.map((block) => ({
        ...block,
        id: generateId(),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setListData((prev) => ({
      schedules: [...prev.schedules, copiedSchedule],
    }));
    setHasChanges(true);

    return copiedSchedule;
  }, [listData.schedules]);

  // 시간표 선택
  const selectSchedule = useCallback((id: string | null) => {
    setCurrentScheduleId(id);
  }, []);

  // 시간표 타이틀 변경
  const setTitle = useCallback((title: string) => {
    if (!currentScheduleId) return;

    setListData((prev) => ({
      schedules: prev.schedules.map((s) =>
        s.id === currentScheduleId
          ? { ...s, title, updatedAt: Date.now() }
          : s
      ),
    }));
    setHasChanges(true);
  }, [currentScheduleId]);

  // 블록 추가
  const addBlock = useCallback((day: number, startTime: number): ScheduleBlock | null => {
    if (!currentSchedule) return null;

    const duration = 60;
    const slot = findNonOverlappingTime(currentSchedule.blocks, day, startTime, duration);
    if (!slot) return null;

    const newBlock: ScheduleBlock = {
      id: generateId(),
      title: '새 일정',
      day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
    };

    setListData((prev) => ({
      schedules: prev.schedules.map((s) =>
        s.id === currentScheduleId
          ? { ...s, blocks: [...s.blocks, newBlock], updatedAt: Date.now() }
          : s
      ),
    }));
    setHasChanges(true);

    return newBlock;
  }, [currentSchedule, currentScheduleId]);

  // 블록 업데이트
  const updateBlock = useCallback((id: string, updates: Partial<ScheduleBlock>) => {
    if (!currentScheduleId) return;

    setListData((prev) => ({
      schedules: prev.schedules.map((s) =>
        s.id === currentScheduleId
          ? {
              ...s,
              blocks: s.blocks.map((block) =>
                block.id === id ? { ...block, ...updates } : block
              ),
              updatedAt: Date.now(),
            }
          : s
      ),
    }));
    setHasChanges(true);
  }, [currentScheduleId]);

  // 블록 삭제
  const deleteBlock = useCallback((id: string) => {
    if (!currentScheduleId) return;

    setListData((prev) => ({
      schedules: prev.schedules.map((s) =>
        s.id === currentScheduleId
          ? {
              ...s,
              blocks: s.blocks.filter((block) => block.id !== id),
              updatedAt: Date.now(),
            }
          : s
      ),
    }));
    setHasChanges(true);
  }, [currentScheduleId]);

  // 블록 복제
  const duplicateBlock = useCallback((id: string, targetDay: number, targetStartTime: number): ScheduleBlock | null => {
    if (!currentSchedule) return null;

    const sourceBlock = currentSchedule.blocks.find((b) => b.id === id);
    if (!sourceBlock) return null;

    const duration = sourceBlock.endTime - sourceBlock.startTime;
    const slot = findNonOverlappingTime(currentSchedule.blocks, targetDay, targetStartTime, duration);
    if (!slot) return null;

    const newBlock: ScheduleBlock = {
      ...sourceBlock,
      id: generateId(),
      day: targetDay,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    setListData((prev) => ({
      schedules: prev.schedules.map((s) =>
        s.id === currentScheduleId
          ? { ...s, blocks: [...s.blocks, newBlock], updatedAt: Date.now() }
          : s
      ),
    }));
    setHasChanges(true);

    return newBlock;
  }, [currentSchedule, currentScheduleId]);

  return {
    // 목록 관련
    schedules: listData.schedules,
    currentSchedule,
    currentScheduleId,
    createSchedule,
    deleteSchedule,
    copySchedule,
    selectSchedule,
    // 현재 시간표 관련
    hasChanges,
    isLoading,
    syncStatus,
    setTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    save,
    // 편집 모드
    isEditMode,
    canEdit,
    enterEditMode,
    exitEditMode,
    cancelEdit,
  };
}
