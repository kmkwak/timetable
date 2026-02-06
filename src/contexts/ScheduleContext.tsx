import { createContext, useContext, ReactNode } from 'react';
import { useSchedule } from '../hooks/useSchedule';

type ScheduleContextType = ReturnType<typeof useSchedule>;

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const schedule = useSchedule();
  return (
    <ScheduleContext.Provider value={schedule}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider');
  }
  return context;
}
