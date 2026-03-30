import { useState, useEffect } from "react";
import type { CalendarEvent } from "../data/types";

export function useEvents(): Record<string, CalendarEvent[]> {
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});

  useEffect(() => {
    fetch("/events.json")
      .then((r) => r.json())
      .then(setEvents)
      .catch((err) => console.error("Failed to load events.json:", err));
  }, []);

  return events;
}
