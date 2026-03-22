import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  getDay,
} from "date-fns";
import holidayJp from "@holiday-jp/holiday_jp";

export interface CalendarDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName: string | undefined;
  dayOfWeek: number; // 0=Sun ... 6=Sat
}

/**
 * 指定月のカレンダー用日付配列を生成する。
 * 週の開始は日曜日（日本慣習）。
 */
export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const target = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(target);
  const monthEnd = endOfMonth(target);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((date) => {
    const holiday = holidayJp.isHoliday(date)
      ? holidayJp.between(date, date)[0]
      : undefined;

    return {
      date,
      dateKey: format(date, "yyyy-MM-dd"),
      isCurrentMonth: isSameMonth(date, target),
      isToday: isToday(date),
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      dayOfWeek: getDay(date),
    };
  });
}
