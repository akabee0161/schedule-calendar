import { useRef } from "react";
import type { CalendarDay } from "../utils/calendar";
import type { CalendarEvent } from "../data/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const SWIPE_THRESHOLD = 50;
const HORIZONTAL_DOMINANCE_RATIO = 1.5;

interface Props {
  days: CalendarDay[];
  events: Record<string, CalendarEvent[]>;
  onDayClick: (dateKey: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
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

export function CalendarGrid({
  days,
  events,
  onDayClick,
  onSwipeLeft,
  onSwipeRight,
}: Props) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE_RATIO) return; // 縦方向と紛らわしい場合は無視
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return (
    <div
      className="grid grid-cols-7 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
            role="button"
            tabIndex={0}
            aria-label={day.dateKey}
            onClick={() => onDayClick(day.dateKey)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDayClick(day.dateKey);
              }
            }}
            className={`min-h-[7rem] cursor-pointer border-b border-r border-gray-100 p-0.5 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:min-h-[5.5rem] sm:p-1 ${
              day.isToday ? "bg-yellow-50 hover:bg-yellow-100" : ""
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
              {dayEvents.map((ev) => (
                <span
                  key={ev.id}
                  className="line-clamp-2 break-words rounded px-0.5 text-[0.55rem] leading-tight text-white sm:px-1 sm:text-xs"
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
