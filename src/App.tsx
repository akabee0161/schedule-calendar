import { useState } from "react";
import { useCalendar } from "./hooks/useCalendar";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarGrid } from "./components/CalendarGrid";
import { EventModal } from "./components/EventModal";

function App() {
  const {
    year,
    month,
    days,
    setYear,
    setMonth,
    goToPrevMonth,
    goToNextMonth,
  } = useCalendar();
  const { events, loading, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          読み込み中…
        </div>
      ) : (
        <CalendarGrid
          days={days}
          events={events}
          onDayClick={setSelectedDate}
          onSwipeLeft={goToNextMonth}
          onSwipeRight={goToPrevMonth}
        />
      )}

      {selectedDate !== null && (
        <EventModal
          date={selectedDate}
          events={events[selectedDate] ?? []}
          onClose={() => setSelectedDate(null)}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}

export default App;
