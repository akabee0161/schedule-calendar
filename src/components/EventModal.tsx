import { useState } from "react";
import type { CalendarEvent } from "../data/types";

const PRESET_COLORS = [
  { label: "青", value: "#3b82f6" },
  { label: "赤", value: "#ef4444" },
  { label: "緑", value: "#22c55e" },
  { label: "黄", value: "#f59e0b" },
  { label: "紫", value: "#a855f7" },
  { label: "ピンク", value: "#EF9E9E" },
  { label: "グレー", value: "#6b7280" },
] as const;

const DEFAULT_COLOR = PRESET_COLORS[0].value;

interface Props {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
  onCreate: (date: string, title: string, color?: string) => Promise<void>;
  onUpdate: (event: CalendarEvent) => Promise<void>;
  onDelete: (event: CalendarEvent) => Promise<void>;
}

type FormMode = "none" | "create" | "edit";

interface FormState {
  title: string;
  color: string;
  submitting: boolean;
  error: string;
}

const initialForm: FormState = {
  title: "",
  color: DEFAULT_COLOR,
  submitting: false,
  error: "",
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export function EventModal({
  date,
  events,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<FormMode>("none");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  function openCreate() {
    setEditingEvent(null);
    setForm(initialForm);
    setMode("create");
  }

  function openEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      color: ev.color ?? DEFAULT_COLOR,
      submitting: false,
      error: "",
    });
    setMode("edit");
  }

  function cancelForm() {
    setMode("none");
    setEditingEvent(null);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setForm((f) => ({ ...f, error: "タイトルを入力してください" }));
      return;
    }
    setForm((f) => ({ ...f, submitting: true, error: "" }));
    try {
      if (mode === "create") {
        await onCreate(date, form.title.trim(), form.color);
      } else if (mode === "edit" && editingEvent) {
        await onUpdate({
          ...editingEvent,
          title: form.title.trim(),
          color: form.color,
        });
      }
      setForm(initialForm);
      setMode("none");
      setEditingEvent(null);
    } catch {
      setForm((f) => ({
        ...f,
        submitting: false,
        error: "保存に失敗しました。再度お試しください。",
      }));
    }
  }

  async function handleDelete(ev: CalendarEvent) {
    setForm((f) => ({ ...f, submitting: true }));
    try {
      await onDelete(ev);
      setForm(initialForm);
      setMode("none");
      setEditingEvent(null);
    } catch {
      setForm((f) => ({
        ...f,
        submitting: false,
        error: "削除に失敗しました。再度お試しください。",
      }));
    }
  }

  const modalTitleId = "event-modal-title";

  return (
    /* オーバーレイ */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={form.submitting ? undefined : onClose}
    >
      {/* ダイアログ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            id={modalTitleId}
            className="text-base font-semibold text-gray-800"
          >
            {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
            aria-label="閉じる"
            disabled={form.submitting}
          >
            ✕
          </button>
        </div>

        {/* 予定リスト */}
        {events.length === 0 && mode === "none" && (
          <p className="mb-3 text-sm text-gray-400">予定はありません</p>
        )}
        {events.length > 0 && (
          <ul className="mb-3 space-y-1">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: ev.color ?? "#6b7280" }}
                />
                <span className="flex-1 truncate text-sm text-gray-700">
                  {ev.title}
                </span>
                <button
                  onClick={() => openEdit(ev)}
                  className="shrink-0 text-xs text-gray-400 hover:text-blue-500"
                  disabled={form.submitting}
                >
                  編集
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* フォーム (create / edit) */}
        {mode !== "none" && (
          <div className="mb-3 rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">
              {mode === "create" ? "新しい予定" : "予定を編集"}
            </p>

            {/* タイトル入力 */}
            <input
              type="text"
              placeholder="タイトル"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSubmit();
              }}
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
              autoFocus
              disabled={form.submitting}
            />

            {/* カラー選択 */}
            <div className="mb-3 flex gap-1.5" role="radiogroup" aria-label="色を選択">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={form.color === c.value}
                  tabIndex={form.color === c.value ? 0 : -1}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    form.color === c.value
                      ? "scale-125 ring-2 ring-offset-1"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                  disabled={form.submitting}
                />
              ))}
            </div>

            {/* エラー */}
            {form.error && (
              <p className="mb-2 text-xs text-red-500">{form.error}</p>
            )}

            {/* ボタン行 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleSubmit()}
                disabled={form.submitting}
                className="flex-1 rounded-lg bg-blue-500 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {form.submitting ? "保存中…" : "保存"}
              </button>
              {mode === "edit" && editingEvent && (
                <button
                  onClick={() => void handleDelete(editingEvent)}
                  disabled={form.submitting}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-100 disabled:opacity-50"
                >
                  削除
                </button>
              )}
              <button
                onClick={cancelForm}
                disabled={form.submitting}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 追加ボタン */}
        {mode === "none" && (
          <button
            onClick={openCreate}
            className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500"
          >
            ＋ 予定を追加
          </button>
        )}
      </div>
    </div>
  );
}
