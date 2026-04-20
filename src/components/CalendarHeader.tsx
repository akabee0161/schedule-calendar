interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function buildYearOptions(current: number): number[] {
  const today = new Date().getFullYear();
  const set = new Set([today - 1, today, today + 1, current]);
  return [...set].sort((a, b) => a - b);
}

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onYearChange,
  onMonthChange,
}: Props) {
  const yearOptions = buildYearOptions(year);

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        aria-label="前の月"
        className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        &lt;
      </button>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xl font-bold">
          <select
            aria-label="年を選択"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="cursor-pointer rounded border border-gray-300 bg-white px-1 py-0.5 text-lg font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span>年</span>
        </label>
        <label className="flex items-center gap-1 text-xl font-bold">
          <select
            aria-label="月を選択"
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="cursor-pointer rounded border border-gray-300 bg-white px-1 py-0.5 text-lg font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span>月</span>
        </label>
      </div>
      <button
        onClick={onNext}
        aria-label="次の月"
        className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        &gt;
      </button>
    </header>
  );
}
