export interface CalendarEvent {
  title: string;
  color?: string;
}

/**
 * 日付文字列 (YYYY-MM-DD) をキーとした予定データ。
 * 予定の追加・変更はこのファイルを直接編集してください。
 */
export const events: Record<string, CalendarEvent[]> = {
  "2026-03-23": [
    { title: "歯医者", color: "#3b82f6" },
  ],
  "2026-03-25": [
    { title: "参観日", color: "#10b981" },
  ],
  "2026-04-01": [
    { title: "入学式", color: "#f59e0b" },
  ],
  "2026-04-29": [
    { title: "家族旅行", color: "#8b5cf6" },
  ],
  "2026-05-05": [
    { title: "BBQ", color: "#ef4444" },
  ],
};
