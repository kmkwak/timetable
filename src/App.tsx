import { useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ScheduleBlock } from './types/schedule';
import { ScheduleProvider, useScheduleContext } from './contexts/ScheduleContext';
import { Header } from './components/Header';
import { Timetable } from './components/Timetable';
import { TimetableList } from './components/TimetableList';
import { EditModal } from './components/EditModal';

function TimetableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    schedules,
    currentSchedule,
    selectSchedule,
    hasChanges,
    isLoading,
    setTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    save,
  } = useScheduleContext();

  // URL의 id로 시간표 선택
  useEffect(() => {
    if (id && !isLoading) {
      const exists = schedules.some((s) => s.id === id);
      if (exists) {
        selectSchedule(id);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [id, schedules, isLoading, selectSchedule, navigate]);

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

  if (!currentSchedule) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
        <div className="text-center">
          <p className="text-gray-600">시간표를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center items-center p-2 sm:p-6 bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
      <div className="h-full w-full max-w-5xl flex flex-col bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <Header
          title={currentSchedule.title}
          onTitleChange={setTitle}
          hasChanges={hasChanges}
          onSave={save}
          onBack={handleBack}
          isMobile={isMobile}
        />

        <Timetable
          blocks={currentSchedule.blocks}
          onAddBlock={addBlock}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onDuplicateBlock={duplicateBlock}
          onEditBlock={handleEditBlock}
        />

        {editingBlock && !isMobile && (
          <EditModal
            block={editingBlock}
            onSave={handleUpdateEditingBlock}
            onClose={handleCloseModal}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}

function TimetableListPage() {
  const navigate = useNavigate();
  const {
    schedules,
    createSchedule,
    deleteSchedule,
    copySchedule,
    isLoading,
  } = useScheduleContext();

  const handleSelect = useCallback((id: string) => {
    navigate(`/schedule/${id}`);
  }, [navigate]);

  const handleCreate = useCallback((title: string) => {
    const newSchedule = createSchedule(title);
    navigate(`/schedule/${newSchedule.id}`);
  }, [createSchedule, navigate]);

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
    <TimetableList
      schedules={schedules}
      onSelect={handleSelect}
      onCreate={handleCreate}
      onDelete={deleteSchedule}
      onCopy={copySchedule}
    />
  );
}

function App() {
  return (
    <HashRouter>
      <ScheduleProvider>
        <Routes>
          <Route path="/" element={<TimetableListPage />} />
          <Route path="/schedule/:id" element={<TimetableDetail />} />
        </Routes>
      </ScheduleProvider>
    </HashRouter>
  );
}

export default App;
