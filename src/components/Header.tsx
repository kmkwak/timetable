import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  hasChanges: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onBack: () => void;
  isMobile: boolean;
  isEditMode?: boolean;
  canEdit?: boolean;
  onEnterEditMode?: () => void;
  onMenuClick?: () => void;
}

export function Header({
  title,
  onTitleChange,
  hasChanges,
  onSave,
  onCancel,
  onBack,
  isMobile,
  isEditMode = false,
  canEdit = false,
  onEnterEditMode,
  onMenuClick,
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
    if (isMobile || !isEditMode || !onTitleChange) return;
    setEditValue(title);
    setIsEditing(true);
  };

  const handleEndEdit = () => {
    if (editValue.trim() && onTitleChange) {
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

  // Home 아이콘 컴포넌트
  const HomeButton = () => (
    <button
      onClick={onBack}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
      title="시간표 목록"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
  );

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shrink-0">
      {/* 왼쪽 영역 */}
      <div className="flex items-center gap-2">
        {/* 모바일용 메뉴 버튼 */}
        {isMobile && onMenuClick && (
          <button
            onClick={onMenuClick}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

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
              !isMobile && isEditMode ? 'cursor-pointer hover:text-white/80' : ''
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

      {/* 오른쪽 영역 */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          /* 모바일: Home 아이콘만 */
          <HomeButton />
        ) : (
          /* PC: 편집 버튼들 + Home 아이콘 */
          <>
            {isEditMode ? (
              /* 편집 모드: 취소/저장 버튼 */
              <>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-md bg-white/20 text-white hover:bg-white/30 active:scale-95"
                >
                  취소
                </button>
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
              </>
            ) : (
              /* 뷰 모드: 편집 버튼 (권한 있을 때만) */
              canEdit && onEnterEditMode && (
                <button
                  onClick={onEnterEditMode}
                  className="px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-md bg-white text-fuchsia-600 hover:bg-white/90 active:scale-95"
                >
                  편집
                </button>
              )
            )}
            <HomeButton />
          </>
        )}
      </div>
    </header>
  );
}
