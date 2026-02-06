// 시간표 설정
export const TIME_START = 8; // 8시
export const TIME_END = 19; // 19시
export const TIME_SLOT_MINUTES = 10; // 10분 단위 스냅

// 요일 (월~금)
export const DAYS = ['월', '화', '수', '목', '금'];
export const DAYS_SHORT = ['월', '화', '수', '목', '금'];

// 드래그 임계값 (픽셀)
export const DRAG_THRESHOLD = 5;

// 색상 프리셋 (선명하고 생동감 있는 그라데이션)
export const COLORS: Record<string, { from: string; to: string; text: string }> = {
  sky: { from: '#00D4FF', to: '#0099FF', text: '#ffffff' },
  mint: { from: '#00E5A0', to: '#00C278', text: '#ffffff' },
  violet: { from: '#9F7AEA', to: '#7C3AED', text: '#ffffff' },
  rose: { from: '#FF6B8A', to: '#FF2D55', text: '#ffffff' },
  amber: { from: '#FFD600', to: '#FFAB00', text: '#1f2937' },
  coral: { from: '#FF7F50', to: '#FF5722', text: '#ffffff' },
  lime: { from: '#AAFF00', to: '#76FF03', text: '#1f2937' },
  fuchsia: { from: '#FF44EC', to: '#D500F9', text: '#ffffff' },
  cyan: { from: '#00FFFF', to: '#00E5FF', text: '#1f2937' },
  peach: { from: '#FFAB91', to: '#FF8A65', text: '#1f2937' },
};

export const COLOR_KEYS = Object.keys(COLORS);

// localStorage 키
export const STORAGE_KEY = 'timetable_schedules';
