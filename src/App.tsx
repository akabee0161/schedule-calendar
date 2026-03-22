import { useCalendar } from "./hooks/useCalendar";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarGrid } from "./components/CalendarGrid";
import { events } from "./data/events";

function App() {
  const { year, month, days, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendar();

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
