import { useRef, useCallback, useEffect, useState } from 'react';
import { ScheduleBlock, GhostBlock as GhostBlockType } from '../types/schedule';
import { DAYS, DAYS_SHORT, TIME_START, TIME_END } from '../config/constants';
import { useDragDrop } from '../hooks/useDragDrop';
import { TimeBlock } from './TimeBlock';
import { GhostBlock } from './GhostBlock';
import { pixelsToMinutes } from '../utils/time';

interface TimetableProps {
  blocks: ScheduleBlock[];
  onAddBlock?: (day: number, startTime: number) => ScheduleBlock | null;
  onUpdateBlock?: (id: string, updates: Partial<ScheduleBlock>) => void;
  onDeleteBlock?: (id: string) => void;
  onDuplicateBlock?: (id: string, day: number, startTime: number) => ScheduleBlock | null;
  onEditBlock?: (block: ScheduleBlock) => void;
  readOnly?: boolean;
}

export function Timetable({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onEditBlock,
  readOnly = false,
}: TimetableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [ghostBlock, setGhostBlock] = useState<GhostBlockType | null>(null);

  // readOnly일 때는 빈 함수 사용
  const noopUpdate = useCallback(() => {}, []);
  const { isDragging, startDrag, onDrag, endDrag, wasJustDragging } = useDragDrop({
    blocks,
    updateBlock: readOnly ? noopUpdate : (onUpdateBlock || noopUpdate),
    containerRef: gridRef,
  });

  // 반응형 체크
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 마우스/터치 이벤트 처리
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      onDrag(clientX, clientY);
    };

    const handleEnd = () => {
      endDrag();
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [onDrag, endDrag]);

  // 빈 셀 클릭 처리
  const handleCellClick = useCallback((e: React.MouseEvent, day: number) => {
    if (readOnly || isMobile) return; // readOnly나 모바일에서는 비활성화
    if (isDragging || wasJustDragging()) return;

    // 고스트 블록 배치 모드
    if (ghostBlock && onDuplicateBlock) {
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect) return;

      const headerHeight = 40;
      const y = e.clientY - gridRect.top - headerHeight;
      const gridHeight = gridRect.height - headerHeight;
      const startTime = pixelsToMinutes(y, gridHeight);

      onDuplicateBlock(ghostBlock.block.id, day, startTime);
      setGhostBlock(null);
      return;
    }

    // 새 블록 생성
    if (!onAddBlock) return;
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const headerHeight = 40;
    const y = e.clientY - gridRect.top - headerHeight;
    const gridHeight = gridRect.height - headerHeight;
    const startTime = pixelsToMinutes(y, gridHeight);

    onAddBlock(day, startTime);
  }, [readOnly, isMobile, isDragging, ghostBlock, onAddBlock, onDuplicateBlock, wasJustDragging]);

  // 복제 시작
  const handleStartDuplicate = useCallback((block: ScheduleBlock) => {
    if (isMobile) return; // 모바일에서는 비활성화
    setGhostBlock({ block, active: true });
  }, [isMobile]);

  // 복제 취소
  const handleCancelDuplicate = useCallback(() => {
    setGhostBlock(null);
  }, []);

  // 시간 라벨 생성
  const timeLabels: number[] = [];
  for (let h = TIME_START; h <= TIME_END; h++) {
    timeLabels.push(h);
  }

  const days = isMobile ? DAYS_SHORT : DAYS;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
      <div ref={gridRef} className="flex-1 flex flex-col">
        {/* 요일 헤더 */}
        <div className="flex shrink-0 bg-gradient-to-r from-sky-50 via-violet-50 to-rose-50">
          <div className="w-10 shrink-0" />
          {days.map((day, index) => {
            const dayColors = [
              'text-sky-600',      // 월
              'text-emerald-600',  // 화
              'text-violet-600',   // 수
              'text-amber-600',    // 목
              'text-fuchsia-600',  // 금
              'text-rose-500',     // 토
              'text-red-500',      // 일
            ];
            return (
              <div
                key={index}
                className={`flex-1 py-3 text-center text-sm font-bold ${dayColors[index]}`}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* 시간표 그리드 */}
        <div className="flex-1 flex relative">
          {/* 시간 레이블 */}
          <div className="w-10 shrink-0 relative bg-gradient-to-b from-violet-50/50 to-rose-50/50">
            {timeLabels.slice(0, -1).map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-sm text-violet-600 font-bold text-right pr-2"
                style={{
                  top: `${(index / (timeLabels.length - 1)) * 100}%`,
                  paddingTop: '2px',
                }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* 요일 컬럼 */}
          <div className="flex-1 flex">
            {days.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 relative border-l border-gray-200"
                onClick={(e) => handleCellClick(e, dayIndex)}
              >
                {/* 시간 라인 */}
                {timeLabels.map((_, index) => (
                  <div
                    key={index}
                    className="absolute left-0 right-0 border-t border-gray-200"
                    style={{
                      top: `${(index / (timeLabels.length - 1)) * 100}%`,
                    }}
                  />
                ))}

                {/* 해당 요일의 블록들 */}
                {blocks
                  .filter((block) => block.day === dayIndex)
                  .map((block) => (
                    <TimeBlock
                      key={block.id}
                      block={block}
                      onStartDrag={readOnly ? () => {} : startDrag}
                      onClick={() => onEditBlock?.(block)}
                      onDelete={() => onDeleteBlock?.(block.id)}
                      onDuplicate={() => handleStartDuplicate(block)}
                      isDragging={isDragging}
                      isMobile={isMobile || readOnly}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 고스트 블록 */}
      {ghostBlock && (
        <GhostBlock
          block={ghostBlock.block}
          onCancel={handleCancelDuplicate}
        />
      )}
    </div>
  );
}
