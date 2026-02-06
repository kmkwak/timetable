export interface ScheduleBlock {
  id: string;
  title: string;
  day: number; // 0=월, 1=화, ..., 6=일
  startTime: number; // 분 단위 (예: 480 = 8:00)
  endTime: number; // 분 단위
  color: string; // 색상 키
}

export interface ScheduleData {
  id: string;
  blocks: ScheduleBlock[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleListData {
  schedules: ScheduleData[];
}

export type DragMode = 'move' | 'resize-top' | 'resize-bottom' | null;

export interface DragState {
  blockId: string | null;
  mode: DragMode;
  startX: number;
  startY: number;
  originalBlock: ScheduleBlock | null;
}

export interface GhostBlock {
  block: ScheduleBlock;
  active: boolean;
}
