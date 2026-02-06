import { useState, useEffect } from 'react';
import { getGitHubToken, setGitHubToken } from '../utils/github';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenChange: () => void;
}

export function SettingsModal({ isOpen, onClose, onTokenChange }: SettingsModalProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToken(getGitHubToken());
    }
  }, [isOpen]);

  const handleSave = () => {
    setGitHubToken(token.trim());
    onTokenChange();
    onClose();
  };

  const handleClear = () => {
    setToken('');
    setGitHubToken('');
    onTokenChange();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Token
            </label>
            <p className="text-xs text-gray-500 mb-2">
              시간표를 수정하려면 GitHub Personal Access Token이 필요합니다.
              토큰이 없으면 보기만 가능합니다.
            </p>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {showToken ? '숨기기' : '보기'}
              </button>
            </div>
          </div>

          {token && (
            <button
              onClick={handleClear}
              className="text-sm text-red-500 hover:text-red-600"
            >
              토큰 삭제
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
