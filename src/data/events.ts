import { eachDayOfInterval, parseISO, format } from "date-fns";

export interface CalendarEvent {
  title: string;
  color?: string;
}

/**
 * 日付キーの形式:
 *   - 単日: "YYYY-MM-DD"
 *   - 期間: "YYYY-MM-DD/YYYY-MM-DD" (開始日/終了日、両端含む)
 */
const rawEvents: Record<string, CalendarEvent[]> = {
  "2026-03-20/2026-03-21": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
  "2026-03-24/2026-04-06": [
    { title: "春休み", color: "#EF9E9E" },
  ],
  "2026-03-28/2026-03-29": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
  "2026-04-04/2026-04-05": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
  "2026-04-07": [
    { title: "始業式", color: "#f59e0b" },
  ],
  "2026-04-11": [
    { title: "岐阜", color: "#3b82f6" },
  ],
  "2026-04-25/2026-04-26": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
  "2026-05-04/2026-05-05": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
  "2026-05-16": [
    { title: "岐阜", color: "#3b82f6" },
  ],
  "2026-05-23": [
    { title: "BBQ", color: "#62E062" },
  ],
  "2026-05-23/2026-05-24": [
    { title: "岐阜-おとまり", color: "#3b82f6" },
  ],
};

function expandEvents(
  raw: Record<string, CalendarEvent[]>,
): Record<string, CalendarEvent[]> {
  const result: Record<string, CalendarEvent[]> = {};
  for (const [key, evts] of Object.entries(raw)) {
    if (key.includes("/")) {
      const [startStr, endStr] = key.split("/");
      const days = eachDayOfInterval({
        start: parseISO(startStr),
        end: parseISO(endStr),
      });
      for (const day of days) {
        const dateKey = format(day, "yyyy-MM-dd");
        result[dateKey] = [...(result[dateKey] ?? []), ...evts];
      }
    } else {
      result[key] = [...(result[key] ?? []), ...evts];
    }
  }
  return result;
}

export const events = expandEvents(rawEvents);
