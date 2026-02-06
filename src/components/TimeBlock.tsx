import { useCallback, useRef } from 'react';
import { ScheduleBlock, DragMode } from '../types/schedule';
import { COLORS, TIME_START, TIME_END, DRAG_THRESHOLD } from '../config/constants';
import { minutesToTimeString } from '../utils/time';

interface TimeBlockProps {
  block: ScheduleBlock;
  onStartDrag: (blockId: string, mode: DragMode, clientX: number, clientY: number) => void;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragging: boolean;
  isMobile: boolean;
}

export function TimeBlock({
  block,
  onStartDrag,
  onClick,
  onDelete,
  onDuplicate,
  isDragging,
  isMobile,
}: TimeBlockProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const color = COLORS[block.color] || COLORS.blue;
  const totalMinutes = (TIME_END - TIME_START) * 60;
  const startOffset = block.startTime - TIME_START * 60;
  const duration = block.endTime - block.startTime;

  const topPercent = (startOffset / totalMinutes) * 100;
  const heightPercent = (duration / totalMinutes) * 100;

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: DragMode) => {
    if (isMobile) return; // 모바일에서는 드래그 비활성화
    e.stopPropagation();
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    onStartDrag(block.id, mode, e.clientX, e.clientY);
  }, [block.id, onStartDrag, isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent, _mode: DragMode) => {
    if (isMobile) return; // 모바일에서는 드래그 비활성화
    e.stopPropagation();
    const touch = e.touches[0];
    mouseDownPos.current = { x: touch.clientX, y: touch.clientY };
    onStartDrag(block.id, _mode, touch.clientX, touch.clientY);
  }, [block.id, onStartDrag, isMobile]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) return; // 모바일에서는 클릭 비활성화
    e.stopPropagation();

    // 드래그가 발생했으면 클릭 무시
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD) {
        mouseDownPos.current = null;
        return;
      }
    }
    mouseDownPos.current = null;
    onClick();
  }, [isMobile, onClick]);

  return (
    <>
      <div
        className={`absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer select-none group transition-all ${
          isDragging ? 'shadow-xl z-50 scale-[1.02]' : 'shadow-md hover:shadow-lg hover:scale-[1.01] z-10'
        }`}
        style={{
          top: `${topPercent}%`,
          height: `${heightPercent}%`,
          minHeight: '24px',
          background: `linear-gradient(145deg, ${color.from} 0%, ${color.to} 100%)`,
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderLeft: '1px solid rgba(255,255,255,0.2)',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          borderBottom: '2px solid rgba(0,0,0,0.15)',
        }}
        onClick={handleClick}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onTouchStart={(e) => handleTouchStart(e, 'move')}
      >
        {/* 상단 하이라이트 */}
        <div
          className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 100%)',
          }}
        />

        {/* 상단 리사이즈 핸들 */}
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 z-10"
          onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
          onTouchStart={(e) => handleTouchStart(e, 'resize-top')}
          onClick={(e) => e.stopPropagation()}
        />

        {/* 내용 */}
        <div className="h-full px-2 py-1 flex flex-col relative z-[1]" style={{ color: color.text }}>
          {/* 시간 */}
          <div className="text-[10px] opacity-90 shrink-0 drop-shadow-sm">
            {minutesToTimeString(block.startTime)}-{minutesToTimeString(block.endTime)}
          </div>
          {/* 제목 */}
          <div className="text-xs font-semibold leading-tight line-clamp-3 flex-1 overflow-hidden drop-shadow-sm">
            {block.title}
          </div>
        </div>

        {/* 하단 리사이즈 핸들 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 z-10"
          onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
          onTouchStart={(e) => handleTouchStart(e, 'resize-bottom')}
          onClick={(e) => e.stopPropagation()}
        />

        {/* 데스크톱 액션 버튼 */}
        {!isMobile && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="w-6 h-6 rounded bg-white/90 text-gray-700 text-xs hover:bg-white flex items-center justify-center shadow-sm"
              title="복제"
            >
              ⧉
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-6 h-6 rounded bg-white/90 text-red-600 text-xs hover:bg-white flex items-center justify-center shadow-sm"
              title="삭제"
            >
              ×
            </button>
          </div>
        )}
      </div>

    </>
  );
}
