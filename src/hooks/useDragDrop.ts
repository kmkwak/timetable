import { useState, useCallback, useRef } from 'react';
import { ScheduleBlock, DragState, DragMode } from '../types/schedule';
import { DRAG_THRESHOLD, TIME_START, TIME_END, DAYS } from '../config/constants';
import { pixelsToMinutes, snapToSlot } from '../utils/time';

interface UseDragDropProps {
  blocks: ScheduleBlock[];
  updateBlock: (id: string, updates: Partial<ScheduleBlock>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

// 두 시간 범위가 겹치는지 확인
function isOverlapping(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

// 이동 시 겹치지 않는 위치 찾기
function findNonOverlappingPosition(
  blocks: ScheduleBlock[],
  currentBlockId: string,
  targetDay: number,
  preferredStart: number,
  duration: number,
  minTime: number,
  maxTime: number
): { startTime: number; endTime: number } | null {
  const otherBlocks = blocks
    .filter((b) => b.day === targetDay && b.id !== currentBlockId)
    .sort((a, b) => a.startTime - b.startTime);

  // 원하는 위치가 가능한지 확인
  let adjustedStart = Math.max(minTime, Math.min(maxTime - duration, preferredStart));
  let adjustedEnd = adjustedStart + duration;

  const hasOverlap = otherBlocks.some((b) =>
    isOverlapping(adjustedStart, adjustedEnd, b.startTime, b.endTime)
  );

  if (!hasOverlap) {
    return { startTime: adjustedStart, endTime: adjustedEnd };
  }

  // 겹치면 가장 가까운 빈 공간 찾기
  const gaps: { start: number; end: number }[] = [];

  // 맨 처음부터 첫 번째 블록까지
  if (otherBlocks.length === 0) {
    return { startTime: adjustedStart, endTime: adjustedEnd };
  }

  if (otherBlocks[0].startTime > minTime) {
    gaps.push({ start: minTime, end: otherBlocks[0].startTime });
  }

  // 블록들 사이의 빈 공간
  for (let i = 0; i < otherBlocks.length - 1; i++) {
    if (otherBlocks[i].endTime < otherBlocks[i + 1].startTime) {
      gaps.push({ start: otherBlocks[i].endTime, end: otherBlocks[i + 1].startTime });
    }
  }

  // 마지막 블록부터 끝까지
  if (otherBlocks[otherBlocks.length - 1].endTime < maxTime) {
    gaps.push({ start: otherBlocks[otherBlocks.length - 1].endTime, end: maxTime });
  }

  // 원하는 위치에 가장 가까운 빈 공간 찾기
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

// 위쪽 리사이즈 시 최소 시작 시간 찾기 (위에 있는 블록의 끝 시간)
function getMinStartTimeForResize(
  blocks: ScheduleBlock[],
  currentBlockId: string,
  day: number,
  minTime: number
): number {
  const blocksAbove = blocks
    .filter((b) => b.day === day && b.id !== currentBlockId)
    .filter((b) => b.endTime <= blocks.find((x) => x.id === currentBlockId)!.startTime + 10)
    .sort((a, b) => b.endTime - a.endTime);

  if (blocksAbove.length > 0) {
    return blocksAbove[0].endTime;
  }
  return minTime;
}

// 아래쪽 리사이즈 시 최대 종료 시간 찾기 (아래에 있는 블록의 시작 시간)
function getMaxEndTimeForResize(
  blocks: ScheduleBlock[],
  currentBlockId: string,
  day: number,
  maxTime: number
): number {
  const currentBlock = blocks.find((x) => x.id === currentBlockId);
  if (!currentBlock) return maxTime;

  const blocksBelow = blocks
    .filter((b) => b.day === day && b.id !== currentBlockId)
    .filter((b) => b.startTime >= currentBlock.endTime - 10)
    .sort((a, b) => a.startTime - b.startTime);

  if (blocksBelow.length > 0) {
    return blocksBelow[0].startTime;
  }
  return maxTime;
}

export function useDragDrop({ blocks, updateBlock, containerRef }: UseDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    blockId: null,
    mode: null,
    startX: 0,
    startY: 0,
    originalBlock: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const justDraggedRef = useRef(false);

  const getDayFromX = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const timeColumnWidth = 40; // 시간 열 너비
    const gridWidth = rect.width - timeColumnWidth;
    const dayWidth = gridWidth / DAYS.length;
    const x = clientX - rect.left - timeColumnWidth;
    const day = Math.floor(x / dayWidth);
    return Math.max(0, Math.min(DAYS.length - 1, day));
  }, [containerRef]);

  const getTimeFromY = useCallback((clientY: number): number => {
    if (!containerRef.current) return TIME_START * 60;
    const rect = containerRef.current.getBoundingClientRect();
    const headerHeight = 40; // 헤더 높이
    const gridHeight = rect.height - headerHeight;
    const y = clientY - rect.top - headerHeight;
    return pixelsToMinutes(y, gridHeight);
  }, [containerRef]);

  const startDrag = useCallback((
    blockId: string,
    mode: DragMode,
    clientX: number,
    clientY: number
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    setDragState({
      blockId,
      mode,
      startX: clientX,
      startY: clientY,
      originalBlock: { ...block },
    });
    hasMoved.current = false;
  }, [blocks]);

  const onDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragState.blockId || !dragState.originalBlock || !dragState.mode) return;

    const dx = Math.abs(clientX - dragState.startX);
    const dy = Math.abs(clientY - dragState.startY);

    // 드래그 임계값 확인
    if (!hasMoved.current && dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      return;
    }
    hasMoved.current = true;
    setIsDragging(true);

    const { originalBlock, mode } = dragState;
    const currentTime = getTimeFromY(clientY);
    const currentDay = getDayFromX(clientX);
    const minTime = TIME_START * 60;
    const maxTime = TIME_END * 60;

    let updates: Partial<ScheduleBlock> = {};

    if (mode === 'move') {
      const duration = originalBlock.endTime - originalBlock.startTime;
      const preferredStart = snapToSlot(currentTime - duration / 2);

      // 겹치지 않는 위치 찾기
      const position = findNonOverlappingPosition(
        blocks,
        dragState.blockId,
        currentDay,
        preferredStart,
        duration,
        minTime,
        maxTime
      );

      if (position) {
        updates = {
          day: currentDay,
          startTime: position.startTime,
          endTime: position.endTime,
        };
      }
    } else if (mode === 'resize-top') {
      // 현재 블록의 요일 가져오기
      const currentBlock = blocks.find((b) => b.id === dragState.blockId);
      const day = currentBlock?.day ?? originalBlock.day;

      // 위쪽에 있는 블록의 끝 시간을 최소 시작 시간으로 설정
      const minStartTime = getMinStartTimeForResize(blocks, dragState.blockId, day, minTime);

      const newStartTime = Math.min(
        snapToSlot(currentTime),
        originalBlock.endTime - 10 // 최소 10분
      );
      updates = {
        startTime: Math.max(minStartTime, newStartTime),
      };
    } else if (mode === 'resize-bottom') {
      // 현재 블록의 요일 가져오기
      const currentBlock = blocks.find((b) => b.id === dragState.blockId);
      const day = currentBlock?.day ?? originalBlock.day;

      // 아래쪽에 있는 블록의 시작 시간을 최대 종료 시간으로 설정
      const maxEndTime = getMaxEndTimeForResize(blocks, dragState.blockId, day, maxTime);

      const newEndTime = Math.max(
        snapToSlot(currentTime),
        originalBlock.startTime + 10 // 최소 10분
      );
      updates = {
        endTime: Math.min(maxEndTime, newEndTime),
      };
    }

    if (Object.keys(updates).length > 0) {
      updateBlock(dragState.blockId, updates);
    }
  }, [dragState, blocks, updateBlock, getTimeFromY, getDayFromX]);

  const endDrag = useCallback(() => {
    const wasDragging = hasMoved.current;
    setDragState({
      blockId: null,
      mode: null,
      startX: 0,
      startY: 0,
      originalBlock: null,
    });
    setIsDragging(false);
    hasMoved.current = false;

    // 드래그가 발생했으면 잠시 동안 클릭 무시 플래그 설정
    if (wasDragging) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 100);
    }

    return wasDragging;
  }, []);

  // 방금 드래그가 끝났는지 확인
  const wasJustDragging = useCallback(() => {
    return justDraggedRef.current;
  }, []);

  return {
    dragState,
    isDragging,
    startDrag,
    onDrag,
    endDrag,
    getDayFromX,
    getTimeFromY,
    wasJustDragging,
  };
}
