import { useState, useEffect, useCallback } from "react";
import { gql, subscribe } from "../lib/appsync";
import type { CalendarEvent } from "../data/types";

export type EventsMap = Record<string, CalendarEvent[]>;

// ─── GraphQL ドキュメント ─────────────────────────────────────────────

const LIST_EVENTS = `
  query ListEvents {
    listEvents { id date title color }
  }
`;

const CREATE_EVENT = `
  mutation CreateEvent($date: String!, $title: String!, $color: String) {
    createEvent(date: $date, title: $title, color: $color) {
      id date title color
    }
  }
`;

const UPDATE_EVENT = `
  mutation UpdateEvent($id: ID!, $date: String!, $title: String!, $color: String) {
    updateEvent(id: $id, date: $date, title: $title, color: $color) {
      id date title color
    }
  }
`;

const DELETE_EVENT = `
  mutation DeleteEvent($id: ID!, $date: String!) {
    deleteEvent(id: $id, date: $date) { id date }
  }
`;

const ON_CREATE_EVENT = `
  subscription OnCreateEvent {
    onCreateEvent { id date title color }
  }
`;

const ON_UPDATE_EVENT = `
  subscription OnUpdateEvent {
    onUpdateEvent { id date title color }
  }
`;

const ON_DELETE_EVENT = `
  subscription OnDeleteEvent {
    onDeleteEvent { id date }
  }
`;

// ─── ユーティリティ ───────────────────────────────────────────────────

function toMap(items: CalendarEvent[]): EventsMap {
  return items.reduce<EventsMap>((acc, ev) => {
    acc[ev.date] = [...(acc[ev.date] ?? []), ev];
    return acc;
  }, {});
}

// ─── フック ───────────────────────────────────────────────────────────

export function useCalendarEvents() {
  const [events, setEvents] = useState<EventsMap>({});
  const [loading, setLoading] = useState(true);

  // 全件取得
  const fetchAll = useCallback(async () => {
    const data = await gql<{ listEvents: CalendarEvent[] }>(LIST_EVENTS);
    setEvents(toMap(data.listEvents));
  }, []);

  useEffect(() => {
    fetchAll()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchAll]);

  // リアルタイム購読
  useEffect(() => {
    const unsubCreate = subscribe(ON_CREATE_EVENT, (data) => {
      const ev = (data as { onCreateEvent: CalendarEvent }).onCreateEvent;
      setEvents((prev) => {
        const existing = prev[ev.date] ?? [];
        // 楽観的更新で既に追加済みの場合はスキップ
        if (existing.some((e) => e.id === ev.id)) return prev;
        return { ...prev, [ev.date]: [...existing, ev] };
      });
    });

    const unsubUpdate = subscribe(ON_UPDATE_EVENT, (data) => {
      const ev = (data as { onUpdateEvent: CalendarEvent }).onUpdateEvent;
      setEvents((prev) => ({
        ...prev,
        [ev.date]: (prev[ev.date] ?? []).map((e) => (e.id === ev.id ? ev : e)),
      }));
    });

    const unsubDelete = subscribe(ON_DELETE_EVENT, (data) => {
      const ev = (data as { onDeleteEvent: { id: string; date: string } })
        .onDeleteEvent;
      setEvents((prev) => ({
        ...prev,
        [ev.date]: (prev[ev.date] ?? []).filter((e) => e.id !== ev.id),
      }));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  // ─── CRUD（楽観的更新 + エラー時ロールバック）─────────────────────

  const createEvent = useCallback(
    async (date: string, title: string, color?: string) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const tempEv: CalendarEvent = { id: tempId, date, title, color };

      setEvents((prev) => ({
        ...prev,
        [date]: [...(prev[date] ?? []), tempEv],
      }));

      try {
        const data = await gql<{ createEvent: CalendarEvent }>(CREATE_EVENT, {
          date,
          title,
          color,
        });
        const realEv = data.createEvent;
        setEvents((prev) => ({
          ...prev,
          [date]: (prev[date] ?? []).map((e) =>
            e.id === tempId ? realEv : e,
          ),
        }));
      } catch (err) {
        setEvents((prev) => ({
          ...prev,
          [date]: (prev[date] ?? []).filter((e) => e.id !== tempId),
        }));
        throw err;
      }
    },
    [],
  );

  const updateEvent = useCallback(async (ev: CalendarEvent) => {
    // 楽観的更新と同時に更新前の状態をスナップショットとして取得
    let snapshot: CalendarEvent | undefined;
    setEvents((prev) => {
      snapshot = (prev[ev.date] ?? []).find((e) => e.id === ev.id);
      return {
        ...prev,
        [ev.date]: (prev[ev.date] ?? []).map((e) => (e.id === ev.id ? ev : e)),
      };
    });
    try {
      await gql<{ updateEvent: CalendarEvent }>(UPDATE_EVENT, {
        id: ev.id,
        date: ev.date,
        title: ev.title,
        color: ev.color,
      });
    } catch (err) {
      // 失敗時は更新前の値に戻す
      if (snapshot) {
        const s = snapshot;
        setEvents((prev) => ({
          ...prev,
          [s.date]: (prev[s.date] ?? []).map((e) => (e.id === s.id ? s : e)),
        }));
      }
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (ev: CalendarEvent) => {
    setEvents((prev) => ({
      ...prev,
      [ev.date]: (prev[ev.date] ?? []).filter((e) => e.id !== ev.id),
    }));
    try {
      await gql<{ deleteEvent: CalendarEvent }>(DELETE_EVENT, {
        id: ev.id,
        date: ev.date,
      });
    } catch (err) {
      setEvents((prev) => ({
        ...prev,
        [ev.date]: [...(prev[ev.date] ?? []), ev],
      }));
      throw err;
    }
  }, []);

  return { events, loading, createEvent, updateEvent, deleteEvent };
}
