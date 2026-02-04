import { useState, useEffect } from 'react';
import { ScheduleBlock } from '../types/schedule';
import { COLORS, COLOR_KEYS, TIME_START, TIME_END } from '../config/constants';
import { minutesToTimeString, timeStringToMinutes } from '../utils/time';

interface EditModalProps {
  block: ScheduleBlock;
  onSave: (updates: Partial<ScheduleBlock>) => void;
  onClose: () => void;
  isMobile: boolean;
}

export function EditModal({ block, onSave, onClose, isMobile }: EditModalProps) {
  const [title, setTitle] = useState(block.title);
  const [startTime, setStartTime] = useState(minutesToTimeString(block.startTime));
  const [endTime, setEndTime] = useState(minutesToTimeString(block.endTime));
  const [color, setColor] = useState(block.color);

  useEffect(() => {
    setTitle(block.title);
    setStartTime(minutesToTimeString(block.startTime));
    setEndTime(minutesToTimeString(block.endTime));
    setColor(block.color);
  }, [block]);

  const handleSave = () => {
    const start = timeStringToMinutes(startTime);
    const end = timeStringToMinutes(endTime);

    if (start >= end) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    if (start < TIME_START * 60 || end > TIME_END * 60) {
      alert(`시간은 ${TIME_START}시 ~ ${TIME_END}시 사이여야 합니다.`);
      return;
    }

    onSave({
      title: title.trim() || '새 일정',
      startTime: start,
      endTime: end,
      color,
    });
    onClose();
  };

  // 시간 옵션 생성
  const timeOptions: string[] = [];
  for (let h = TIME_START; h <= TIME_END; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === TIME_END && m > 0) break;
      timeOptions.push(`${h}:${m.toString().padStart(2, '0')}`);
    }
  }

  const modalContent = (
    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl">
      <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
        <span>✏️</span> 일정 편집
      </h2>

      {/* 제목 */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-violet-600 mb-2">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목을 입력하세요"
          className="w-full px-4 py-3 border-2 border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-violet-50/50"
        />
      </div>

      {/* 시간 */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-bold text-fuchsia-600 mb-2">⏰ 시작</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 border-2 border-fuchsia-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent bg-fuchsia-50/50"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-rose-600 mb-2">⏰ 종료</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-rose-50/50"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 색상 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-amber-600 mb-3">🎨 색상</label>
        <div className="flex flex-wrap gap-3">
          {COLOR_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setColor(key)}
              className={`w-10 h-10 rounded-xl transition-all duration-200 shadow-md hover:scale-105 ${
                color === key ? 'ring-3 ring-offset-2 ring-violet-400 scale-110' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${COLORS[key].from} 0%, ${COLORS[key].to} 100%)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg"
        >
          💾 저장
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full animate-slide-up">
          {modalContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {modalContent}
      </div>
    </div>
  );
}
