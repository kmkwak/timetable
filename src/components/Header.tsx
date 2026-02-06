import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  hasChanges: boolean;
  onSave: () => void;
  onBack: () => void;
  isMobile: boolean;
}

export function Header({
  title,
  onTitleChange,
  hasChanges,
  onSave,
  onBack,
  isMobile,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (isMobile) return; // 모바일에서는 편집 비활성화
    setEditValue(title);
    setIsEditing(true);
  };

  const handleEndEdit = () => {
    if (editValue.trim()) {
      onTitleChange(editValue.trim());
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEndEdit();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shrink-0">
      <div className="flex items-center gap-3">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          ←
        </button>

        {/* 타이틀 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEndEdit}
            onKeyDown={handleKeyDown}
            className="text-xl font-bold text-white bg-transparent border-b-2 border-white/50 outline-none px-1 placeholder-white/50"
          />
        ) : (
          <h1
            onClick={handleStartEdit}
            className={`text-xl font-bold text-white transition-colors flex items-center gap-2 ${
              !isMobile ? 'cursor-pointer hover:text-white/80' : ''
            }`}
          >
            {title}
          </h1>
        )}

        {/* 변경사항 표시 */}
        {hasChanges && (
          <span className="w-2.5 h-2.5 bg-amber-300 rounded-full pulse-orange shadow-lg" />
        )}
      </div>

      {/* 저장 버튼 - 데스크톱만 */}
      {!isMobile && (
        <button
          onClick={onSave}
          disabled={!hasChanges}
          className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-md ${
            hasChanges
              ? 'bg-white text-fuchsia-600 hover:bg-white/90 active:scale-95'
              : 'bg-white/30 text-white/60 cursor-not-allowed'
          }`}
        >
          저장
        </button>
      )}
    </header>
  );
}
