import { useState, useCallback } from 'react';
import { PIN } from '../config/constants';

interface PinScreenProps {
  onSuccess: () => void;
}

export function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = useCallback((digit: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === PIN) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, onSuccess]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'];

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-xs">
        <div className="text-center mb-8">
          <span className="text-5xl mb-2 block">📅</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            시간표
          </h1>
        </div>

        {/* PIN 표시 */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                error
                  ? 'bg-rose-500 animate-shake'
                  : pin.length > i
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 키패드 */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((digit, index) => (
            <button
              key={index}
              onClick={() => {
                if (digit === '←') {
                  handleDelete();
                } else if (digit !== '') {
                  handleKeyPress(digit);
                }
              }}
              disabled={digit === ''}
              className={`h-14 rounded-2xl text-xl font-bold transition-all duration-150 ${
                digit === ''
                  ? 'invisible'
                  : digit === '←'
                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 active:scale-95'
                  : 'bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 hover:from-violet-200 hover:to-fuchsia-200 active:scale-95 shadow-sm'
              }`}
            >
              {digit}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-rose-500 text-center mt-4 text-sm font-medium">
            다시 시도해주세요 😅
          </p>
        )}
      </div>
    </div>
  );
}
