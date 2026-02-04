import { useState, useCallback, useEffect } from 'react';
import { ScheduleData, ScheduleBlock } from '../types/schedule';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { fetchFromGitHub, saveToGitHub } from '../utils/github';
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
  // 기존 블록들 사이의 빈 공간을 확인
  const gaps: { start: number; end: number }[] = [];

  // 맨 처음부터 첫 번째 블록까지
  if (dayBlocks.length === 0) {
    return {
      startTime: Math.max(minTime, preferredStart),
      endTime: Math.min(maxTime, Math.max(minTime, preferredStart) + duration),
    };
  }

  if (dayBlocks[0].startTime > minTime) {
    gaps.push({ start: minTime, end: dayBlocks[0].startTime });
  }

  // 블록들 사이의 빈 공간
  for (let i = 0; i < dayBlocks.length - 1; i++) {
    if (dayBlocks[i].endTime < dayBlocks[i + 1].startTime) {
      gaps.push({ start: dayBlocks[i].endTime, end: dayBlocks[i + 1].startTime });
    }
  }

  // 마지막 블록부터 끝까지
  if (dayBlocks[dayBlocks.length - 1].endTime < maxTime) {
    gaps.push({ start: dayBlocks[dayBlocks.length - 1].endTime, end: maxTime });
  }

  // 원하는 시간에 가장 가까운 빈 공간 찾기
  let bestGap: { start: number; end: number } | null = null;
  let bestDistance = Infinity;

  for (const gap of gaps) {
    if (gap.end - gap.start >= duration) {
      // 이 빈 공간에 블록을 놓을 수 있음
      const gapCenter = (gap.start + gap.end) / 2;
      const distance = Math.abs(gapCenter - (preferredStart + duration / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestGap = gap;
      }
    }
  }

  if (bestGap) {
    // 빈 공간 내에서 원하는 시간에 최대한 가깝게 배치
    let startTime = preferredStart;
    if (startTime < bestGap.start) {
      startTime = bestGap.start;
    } else if (startTime + duration > bestGap.end) {
      startTime = bestGap.end - duration;
    }
    return { startTime, endTime: startTime + duration };
  }

  // 빈 공간이 없으면 null 반환
  return null;
}

const initialData: ScheduleData = {
  title: '시간표',
  blocks: [],
};

export function useSchedule() {
  const [data, setData] = useState<ScheduleData>(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // 초기 로드
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setSyncStatus('loading');

      // GitHub에서 먼저 시도
      const githubData = await fetchFromGitHub();
      if (githubData) {
        setData(githubData);
        saveToStorage(githubData);
        setSyncStatus('success');
      } else {
        // 실패 시 localStorage에서 로드
        const localData = loadFromStorage();
        if (localData) {
          setData(localData);
        }
        setSyncStatus('error');
      }

      setIsLoading(false);
    }

    load();
  }, []);

  // 타이틀 변경
  const setTitle = useCallback((title: string) => {
    setData((prev) => ({ ...prev, title }));
    setHasChanges(true);
  }, []);

  // 블록 추가
  const addBlock = useCallback((day: number, startTime: number): ScheduleBlock | null => {
    const duration = 60; // 1시간 기본

    // 겹치지 않는 시간 찾기
    const slot = findNonOverlappingTime(data.blocks, day, startTime, duration);
    if (!slot) {
      // 빈 공간이 없으면 블록 생성 안함
      return null;
    }

    const newBlock: ScheduleBlock = {
      id: generateId(),
      title: '새 일정',
      day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
    };

    setData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setHasChanges(true);

    return newBlock;
  }, [data.blocks]);

  // 블록 업데이트
  const updateBlock = useCallback((id: string, updates: Partial<ScheduleBlock>) => {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    }));
    setHasChanges(true);
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
    setHasChanges(true);
  }, []);

  // 블록 복제
  const duplicateBlock = useCallback((id: string, targetDay: number, targetStartTime: number): ScheduleBlock | null => {
    const sourceBlock = data.blocks.find((b) => b.id === id);
    if (!sourceBlock) return null;

    const duration = sourceBlock.endTime - sourceBlock.startTime;

    // 겹치지 않는 시간 찾기
    const slot = findNonOverlappingTime(data.blocks, targetDay, targetStartTime, duration);
    if (!slot) {
      // 빈 공간이 없으면 복제 안함
      return null;
    }

    const newBlock: ScheduleBlock = {
      ...sourceBlock,
      id: generateId(),
      day: targetDay,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    setData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setHasChanges(true);

    return newBlock;
  }, [data.blocks]);

  // 저장
  const save = useCallback(async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setSyncStatus('loading');

    // localStorage에 먼저 저장
    saveToStorage(data);

    // GitHub에 저장
    const success = await saveToGitHub(data);

    if (success) {
      setSyncStatus('success');
      setHasChanges(false);
    } else {
      setSyncStatus('error');
    }

    setIsSaving(false);
  }, [data, hasChanges, isSaving]);

  return {
    data,
    hasChanges,
    isSaving,
    isLoading,
    syncStatus,
    setTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    save,
  };
}
