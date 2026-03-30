import type { CalendarDay } from "../utils/calendar";
import type { CalendarEvent } from "../data/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

interface Props {
  days: CalendarDay[];
  events: Record<string, CalendarEvent[]>;
}

function weekdayColor(index: number): string {
  if (index === 0) return "text-red-500";
  if (index === 6) return "text-blue-500";
  return "text-gray-700";
}

function dayNumberColor(day: CalendarDay): string {
  if (!day.isCurrentMonth) return "text-gray-300";
  if (day.isHoliday || day.dayOfWeek === 0) return "text-red-500";
  if (day.dayOfWeek === 6) return "text-blue-500";
  return "text-gray-800";
}

export function CalendarGrid({ days, events }: Props) {
  return (
    <div className="grid grid-cols-7">
      {/* 曜日ヘッダー */}
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={label}
          className={`border-b border-gray-200 py-1 text-center text-xs font-semibold ${weekdayColor(i)}`}
        >
          {label}
        </div>
      ))}

      {/* 日付セル */}
      {days.map((day) => {
        const dayEvents = events[day.dateKey] ?? [];
        return (
          <div
            key={day.dateKey}
            className={`min-h-[4.5rem] border-b border-r border-gray-100 p-1 sm:min-h-[5.5rem] ${
              day.isToday ? "bg-yellow-50" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <span
                className={`inline-block text-xs font-medium leading-5 sm:text-sm ${dayNumberColor(day)}`}
              >
                {day.date.getDate()}
              </span>
              {day.isHoliday && day.isCurrentMonth && (
                <span className="truncate text-[0.6rem] leading-5 text-red-400">
                  {day.holidayName}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-col gap-0.5">
              {dayEvents.map((ev, i) => (
                <span
                  key={i}
                  className="truncate rounded px-1 text-[0.65rem] leading-4 text-white sm:text-xs"
                  style={{ backgroundColor: ev.color ?? "#6b7280" }}
                >
                  {ev.title}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
