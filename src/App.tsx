import { useState, useCallback, useEffect, useMemo } from 'react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // 정렬된 시간표 목록
  const sortedSchedules = useMemo(() =>
    [...schedules].sort((a, b) => a.createdAt - b.createdAt),
    [schedules]
  );

  // 시간표 선택 핸들러
  const handleSelectSchedule = useCallback((scheduleId: string) => {
    selectSchedule(scheduleId);
    navigate(`/schedule/${scheduleId}`);
    setDrawerOpen(false);
  }, [selectSchedule, navigate]);

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
    <div className="h-full flex bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
      {/* PC용 좌측 사이드바 */}
      {!isMobile && (
        <div className="w-56 h-full flex-shrink-0 bg-white/70 backdrop-blur-sm border-r border-white/50 flex flex-col">
          <div className="p-4 border-b border-gray-200/50">
            <h2 className="font-semibold text-gray-700 text-sm">시간표 목록</h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {sortedSchedules.map((schedule) => (
              <button
                key={schedule.id}
                onClick={() => handleSelectSchedule(schedule.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all text-sm truncate ${
                  schedule.id === currentScheduleId
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'hover:bg-white/80 text-gray-700'
                }`}
              >
                {schedule.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex justify-center items-center p-2 sm:p-6">
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
            onMenuClick={isMobile ? () => setDrawerOpen(true) : undefined}
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
      </div>

      {/* 모바일용 Drawer */}
      {isMobile && drawerOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 flex flex-col animate-slide-in-left">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">시간표 목록</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {sortedSchedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => handleSelectSchedule(schedule.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition-all truncate ${
                    schedule.id === currentScheduleId
                      ? 'bg-violet-500 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {schedule.title}
                </button>
              ))}
            </div>
          </div>
        </>
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
