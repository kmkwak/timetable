import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleBlock } from '../types/schedule';
import { COLORS, TIME_START, TIME_END } from '../config/constants';
import { minutesToTimeString } from '../utils/time';

interface GhostBlockProps {
  block: ScheduleBlock;
  onCancel: () => void;
}

export function GhostBlock({ block, onCancel }: GhostBlockProps) {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [isVisible, setIsVisible] = useState(false);
  const hasMoved = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!hasMoved.current) {
        hasMoved.current = true;
        setIsVisible(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const color = COLORS[block.color] || COLORS.sky;
  const duration = block.endTime - block.startTime;
  const totalMinutes = (TIME_END - TIME_START) * 60;
  const heightPercent = (duration / totalMinutes) * 100;

  const ghostElement = (
    <div
      style={{
        position: 'fixed',
        left: position.x - 40,
        top: position.y - 20,
        width: '80px',
        height: `${Math.max(40, heightPercent * 5)}px`,
        background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`,
        opacity: isVisible ? 0.8 : 0,
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'opacity 0.1s',
      }}
    >
      <div style={{
        height: '100%',
        padding: '4px 8px',
        display: 'flex',
        flexDirection: 'column',
        color: color.text
      }}>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          {minutesToTimeString(block.startTime)}-{minutesToTimeString(block.endTime)}
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.title}
        </div>
      </div>
    </div>
  );

  return createPortal(ghostElement, document.body);
}
