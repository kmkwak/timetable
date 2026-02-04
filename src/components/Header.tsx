import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
}

export function Header({
  title,
  onTitleChange,
  hasChanges,
  isSaving,
  onSave,
  syncStatus,
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
            className="text-xl font-bold text-white cursor-pointer hover:text-white/80 transition-colors flex items-center gap-2"
          >
            <span>📅</span>
            {title}
          </h1>
        )}

        {/* 변경사항 표시 */}
        {hasChanges && (
          <span className="w-2.5 h-2.5 bg-amber-300 rounded-full pulse-orange shadow-lg" />
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* 동기화 상태 */}
        <span className="text-xs text-white/80 hidden sm:block">
          {syncStatus === 'loading' && '동기화 중...'}
          {syncStatus === 'success' && '✓ 저장됨'}
          {syncStatus === 'error' && '오프라인'}
        </span>

        {/* 저장 버튼 */}
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-md ${
            hasChanges && !isSaving
              ? 'bg-white text-fuchsia-600 hover:bg-white/90 active:scale-95'
              : 'bg-white/30 text-white/60 cursor-not-allowed'
          }`}
        >
          {isSaving ? '⏳' : '💾 저장'}
        </button>
      </div>
    </header>
  );
}
