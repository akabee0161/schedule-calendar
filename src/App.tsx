import { useCalendar } from "./hooks/useCalendar";
import { useEvents } from "./hooks/useEvents";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarGrid } from "./components/CalendarGrid";

function App() {
  const { year, month, days, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendar();
  const events = useEvents();

  return (
    <div className="mx-auto max-w-2xl">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
      />
      <CalendarGrid days={days} events={events} />
    </div>
  );
}

export default App;
