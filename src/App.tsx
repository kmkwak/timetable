import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ScheduleBlock } from './types/schedule';
import { ScheduleProvider, useScheduleContext } from './contexts/ScheduleContext';
import { Header } from './components/Header';
import { Timetable } from './components/Timetable';
import { TimetableList } from './components/TimetableList';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';

function TimetableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    schedules,
    currentSchedule,
    currentScheduleId,
    selectSchedule,
    hasChanges,
    isLoading,
    initialLoadComplete,
    setTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    save,
    isEditMode,
    canEdit,
    enterEditMode,
    exitEditMode,
    cancelEdit,
  } = useScheduleContext();

  // URL의 id로 시간표 선택
  useEffect(() => {
    // 초기 로드가 완료되기 전에는 아무것도 하지 않음
    if (!initialLoadComplete) return;

    if (id && currentScheduleId !== id) {
      const exists = schedules.some((s) => s.id === id);
      if (exists) {
        selectSchedule(id);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [id, schedules, initialLoadComplete, currentScheduleId, selectSchedule, navigate]);

  const handleEditBlock = useCallback((block: ScheduleBlock) => {
    if (isMobile) return;
    setEditingBlock(block);
  }, [isMobile]);

  const handleUpdateEditingBlock = useCallback((updates: Partial<ScheduleBlock>) => {
    if (editingBlock) {
      updateBlock(editingBlock.id, updates);
    }
  }, [editingBlock, updateBlock]);

  const handleCloseModal = useCallback(() => {
    setEditingBlock(null);
  }, []);

  const handleBack = useCallback(() => {
    selectSchedule(null);
    navigate('/');
  }, [selectSchedule, navigate]);

  const handleSaveAndExit = useCallback(async () => {
    await save();
    exitEditMode();
  }, [save, exitEditMode]);

  // 정렬된 시간표 목록과 현재 인덱스
  const sortedSchedules = useMemo(() =>
    [...schedules].sort((a, b) => a.createdAt - b.createdAt),
    [schedules]
  );

  const currentIndex = useMemo(() =>
    sortedSchedules.findIndex(s => s.id === currentScheduleId),
    [sortedSchedules, currentScheduleId]
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < sortedSchedules.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev && !isEditMode) {
      const prevSchedule = sortedSchedules[currentIndex - 1];
      selectSchedule(prevSchedule.id);
      navigate(`/schedule/${prevSchedule.id}`);
    }
  }, [hasPrev, isEditMode, sortedSchedules, currentIndex, selectSchedule, navigate]);

  const goToNext = useCallback(() => {
    if (hasNext && !isEditMode) {
      const nextSchedule = sortedSchedules[currentIndex + 1];
      selectSchedule(nextSchedule.id);
      navigate(`/schedule/${nextSchedule.id}`);
    }
  }, [hasNext, isEditMode, sortedSchedules, currentIndex, selectSchedule, navigate]);

  // 모바일 스와이프 처리
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, [isEditMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isEditMode || touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // 수평 스와이프가 수직보다 크고, 최소 50px 이상 이동했을 때
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrev(); // 오른쪽으로 스와이프 -> 이전
      } else {
        goToNext(); // 왼쪽으로 스와이프 -> 다음
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [isEditMode, goToPrev, goToNext]);

  // 로딩 중이거나 초기 로드가 완료되지 않은 경우
  if (isLoading || !initialLoadComplete) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 시간표 선택 대기 중 (id가 있지만 아직 선택 안됨)
  if (!currentSchedule) {
    if (id && schedules.some((s) => s.id === id)) {
      // 시간표가 존재하는데 아직 선택 안됨 - 로딩 표시
      return (
        <div className="h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">불러오는 중...</p>
          </div>
        </div>
      );
    }
    // 초기 로드 완료 후에도 시간표를 찾을 수 없는 경우
    return (
      <div className="h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
        <div className="text-center">
          <p className="text-gray-600">시간표를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full relative flex justify-center items-center p-2 sm:p-6 bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* PC용 이전 버튼 */}
      {!isMobile && hasPrev && !isEditMode && (
        <button
          onClick={goToPrev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-lg text-gray-600 hover:text-violet-600 transition-all z-10"
          title="이전 시간표"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="h-full w-full max-w-5xl flex flex-col bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <Header
          title={currentSchedule.title}
          onTitleChange={isEditMode ? setTitle : undefined}
          hasChanges={hasChanges}
          onSave={isEditMode ? handleSaveAndExit : undefined}
          onCancel={isEditMode ? cancelEdit : undefined}
          onBack={handleBack}
          isMobile={isMobile}
          isEditMode={isEditMode}
          canEdit={canEdit}
          onEnterEditMode={enterEditMode}
        />

        <Timetable
          blocks={currentSchedule.blocks}
          onAddBlock={isEditMode ? addBlock : undefined}
          onUpdateBlock={isEditMode ? updateBlock : undefined}
          onDeleteBlock={isEditMode ? deleteBlock : undefined}
          onDuplicateBlock={isEditMode ? duplicateBlock : undefined}
          onEditBlock={isEditMode ? handleEditBlock : undefined}
          readOnly={!isEditMode}
        />

        {editingBlock && !isMobile && isEditMode && (
          <EditModal
            block={editingBlock}
            onSave={handleUpdateEditingBlock}
            onClose={handleCloseModal}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* PC용 다음 버튼 */}
      {!isMobile && hasNext && !isEditMode && (
        <button
          onClick={goToNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-lg text-gray-600 hover:text-violet-600 transition-all z-10"
          title="다음 시간표"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function TimetableListPage() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const {
    schedules,
    createSchedule,
    deleteSchedule,
    copySchedule,
    selectSchedule,
    isLoading,
    canEdit,
  } = useScheduleContext();

  const handleSelect = useCallback((id: string) => {
    selectSchedule(id);
    navigate(`/schedule/${id}`);
  }, [selectSchedule, navigate]);

  const handleCreate = useCallback((title: string) => {
    const newSchedule = createSchedule(title);
    selectSchedule(newSchedule.id);
    navigate(`/schedule/${newSchedule.id}`);
  }, [createSchedule, selectSchedule, navigate]);

  const handleTokenChange = useCallback(() => {
    // 토큰 변경 시 페이지 새로고침하여 데이터 다시 로드
    window.location.reload();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TimetableList
        schedules={schedules}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={deleteSchedule}
        onCopy={copySchedule}
        canEdit={canEdit}
        onSettingsClick={() => setShowSettings(true)}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onTokenChange={handleTokenChange}
      />
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <ScheduleProvider>
        <div className="h-full">
          <Routes>
            <Route path="/" element={<TimetableListPage />} />
            <Route path="/schedule/:id" element={<TimetableDetail />} />
          </Routes>
        </div>
      </ScheduleProvider>
    </HashRouter>
  );
}

export default App;
