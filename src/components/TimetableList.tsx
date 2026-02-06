import { useState } from 'react';
import { ScheduleData } from '../types/schedule';
import { COLORS } from '../config/constants';

interface TimetableListProps {
  schedules: ScheduleData[];
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}

export function TimetableList({ schedules, onSelect, onCreate, onDelete, onCopy }: TimetableListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newTitle.trim()) {
      onCreate(newTitle.trim());
      setNewTitle('');
      setShowCreateModal(false);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 시간표 미리보기 - 블록 위치 표시
  const renderPreview = (schedule: ScheduleData) => {
    const colorKeys = Object.keys(COLORS);
    return (
      <div className="grid grid-cols-5 gap-[1px] h-16 bg-gray-200 rounded overflow-hidden">
        {[0, 1, 2, 3, 4].map((day) => {
          const dayBlocks = schedule.blocks.filter((b) => b.day === day);
          return (
            <div key={day} className="bg-gray-50 relative">
              {dayBlocks.slice(0, 3).map((block, idx) => {
                const color = COLORS[block.color] || COLORS[colorKeys[0]];
                const top = ((block.startTime - 480) / 660) * 100;
                const height = ((block.endTime - block.startTime) / 660) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 rounded-[2px]"
                    style={{
                      top: `${Math.max(0, Math.min(100, top))}%`,
                      height: `${Math.max(5, Math.min(100 - top, height))}%`,
                      background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100 p-4 sm:p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">내 시간표</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors shadow-md flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          <span>새 시간표</span>
        </button>
      </div>

      {/* 시간표 목록 */}
      <div className="flex-1 overflow-auto">
        {schedules.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg mb-2">아직 시간표가 없습니다</p>
            <p className="text-sm">새 시간표를 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                  onClick={() => onSelect(schedule.id)}
                >
                  {/* 미리보기 */}
                  <div className="p-3 pb-2">
                    {renderPreview(schedule)}
                  </div>

                  {/* 정보 */}
                  <div className="px-4 pb-4">
                    <h3 className="font-semibold text-gray-800 truncate mb-1">
                      {schedule.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{schedule.blocks.length}개 일정</span>
                      <span>{formatDate(schedule.updatedAt)}</span>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {/* 복사 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(schedule.id);
                      }}
                      className="w-7 h-7 rounded-full bg-white/80 text-gray-400 hover:text-violet-500 hover:bg-white flex items-center justify-center shadow"
                      title="복사"
                    >
                      ⧉
                    </button>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(schedule.id);
                      }}
                      className="w-7 h-7 rounded-full bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white flex items-center justify-center shadow"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">새 시간표 만들기</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="시간표 이름"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="flex-1 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">시간표 삭제</h2>
            <p className="text-gray-600 mb-4">
              정말 이 시간표를 삭제하시겠습니까?
              <br />
              <span className="text-red-500 text-sm">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
