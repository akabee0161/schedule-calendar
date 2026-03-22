interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        &lt;
      </button>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">
          {year}年 {month}月
        </h1>
        <button
          onClick={onToday}
          className="rounded border border-gray-300 px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          今日
        </button>
      </div>
      <button
        onClick={onNext}
        className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        &gt;
      </button>
    </header>
  );
}
