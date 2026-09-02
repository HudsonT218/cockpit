import { useState } from "react";
import type { Habit } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useHabitStore } from "@/lib/habitStore";
import { getMonthGrid } from "@/lib/habitSelectors";
import { cn, isoDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitCalendar({
  habit,
  accent,
}: {
  habit: Habit;
  accent: AccentClasses;
}) {
  const logs = useHabitStore((s) => s.logs);
  const toggleHabitLog = useHabitStore((s) => s.toggleHabitLog);
  const today = isoDate(new Date());
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(cursor.y, cursor.m, 1));

  const cells = getMonthGrid(habit, logs, cursor.y, cursor.m, today);

  const prev = () =>
    setCursor((c) =>
      c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }
    );
  const next = () =>
    setCursor((c) =>
      c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
          Calendar
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center border border-ink-800 rounded-md text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] md:text-xs text-ink-200 w-[104px] md:w-[130px] text-center whitespace-nowrap">
            {monthLabel}
          </span>
          <button
            onClick={next}
            className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center border border-ink-800 rounded-md text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-3 md:p-5">
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2">
          {DAY_LETTERS.map((l, i) => (
            <div
              key={i}
              className="text-center font-mono text-[9px] md:text-[10px] text-ink-600"
            >
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {cells.map((cell, i) => {
            if (!cell.date) {
              return <div key={`blank-${i}`} className="h-10 md:h-11" />;
            }

            let bg = "bg-transparent";
            let fg = "text-ink-500";
            let border = "border-ink-800";
            if (cell.completed) {
              bg = accent.bg;
              fg = "text-ink-950";
              border = "border-transparent";
            } else if (cell.future) {
              bg = "bg-transparent";
              fg = "text-ink-600";
              border = "border-ink-800/60";
            } else if (!cell.due) {
              bg = "bg-ink-900";
              fg = "text-ink-600";
              border = "border-transparent";
            } else {
              bg = "bg-ink-800";
              fg = "text-ink-400";
              border = "border-transparent";
            }
            if (cell.today && !cell.completed) {
              border = "border-ink-500";
            }

            return (
              <button
                key={cell.date}
                disabled={cell.future}
                onClick={() => void toggleHabitLog(habit.id, cell.date!)}
                className={cn(
                  "h-10 md:h-11 w-full rounded-lg flex items-center justify-center font-mono text-xs border transition disabled:cursor-default",
                  bg,
                  fg,
                  border
                )}
              >
                {cell.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
