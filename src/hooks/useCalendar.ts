import { useState, useMemo } from "react";
import { buildCalendarDays, type CalendarDay } from "../utils/calendar";

export interface UseCalendarReturn {
  year: number;
  month: number;
  days: CalendarDay[];
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
}

export function useCalendar(): UseCalendarReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  return { year, month, days, goToPrevMonth, goToNextMonth, goToToday };
}
