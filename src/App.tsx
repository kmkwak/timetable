import { useState, useCallback, useEffect } from 'react';
import { ScheduleBlock } from './types/schedule';
import { useSchedule } from './hooks/useSchedule';
import { saveAuthState, loadAuthState } from './utils/storage';
import { PinScreen } from './components/PinScreen';
import { Header } from './components/Header';
import { Timetable } from './components/Timetable';
import { EditModal } from './components/EditModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(loadAuthState);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 반응형 체크
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    data,
    hasChanges,
    isSaving,
    isLoading,
    syncStatus,
    setTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    save,
  } = useSchedule();

  // 인증 성공 처리
  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    saveAuthState(true);
  }, []);

  // 블록 편집 시작
  const handleEditBlock = useCallback((block: ScheduleBlock) => {
    setEditingBlock(block);
  }, []);

  // 블록 업데이트
  const handleUpdateEditingBlock = useCallback((updates: Partial<ScheduleBlock>) => {
    if (editingBlock) {
      updateBlock(editingBlock.id, updates);
    }
  }, [editingBlock, updateBlock]);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setEditingBlock(null);
  }, []);

  // 인증 전 화면
  if (!isAuthenticated) {
    return <PinScreen onSuccess={handleAuthSuccess} />;
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center items-center p-2 sm:p-6 bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100">
      <div className="h-full w-full max-w-5xl flex flex-col bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <Header
        title={data.title}
        onTitleChange={setTitle}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={save}
        syncStatus={syncStatus}
      />

      <Timetable
        blocks={data.blocks}
        onAddBlock={addBlock}
        onUpdateBlock={updateBlock}
        onDeleteBlock={deleteBlock}
        onDuplicateBlock={duplicateBlock}
        onEditBlock={handleEditBlock}
      />

      {editingBlock && (
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

export default App;
