import type { Habit, HabitCategory } from "@/lib/types";
import { useHabitStore } from "@/lib/habitStore";
import { getThisWeekCells } from "@/lib/habitSelectors";
import { accentOf } from "@/lib/learningAccent";
import { cn, isoDate } from "@/lib/utils";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitWeekGrid({ habits }: { habits: Habit[] }) {
  const logs = useHabitStore((s) => s.logs);
  const categories = useHabitStore((s) => s.categories);
  const today = isoDate(new Date());
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-[18px]">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
          This week
        </div>
        <div className="flex gap-1 font-mono text-[9px] text-ink-600">
          {DAY_LETTERS.map((l, i) => (
            <span key={i} className="w-3.5 text-center">
              {l}
            </span>
          ))}
        </div>
      </div>
      {habits.length === 0 ? (
        <div className="text-sm text-ink-500 py-2">No habits to show.</div>
      ) : (
        <div className="space-y-0">
          {habits.map((h) => {
            const cat: HabitCategory | undefined = h.categoryId
              ? byId.get(h.categoryId)
              : undefined;
            const accent = accentOf(cat?.accent);
            const cells = getThisWeekCells(h, logs, today);
            return (
              <div key={h.id} className="flex items-center gap-2.5 py-1">
                <span className="flex-1 text-xs text-ink-300 truncate">
                  {h.name}
                </span>
                <div className="flex gap-1">
                  {cells.map((cell) => {
                    let bg = "bg-ink-900";
                    if (cell.date > today) bg = "bg-ink-900/60";
                    else if (cell.completed) bg = accent.bg;
                    else if (cell.due) bg = "bg-ink-800";
                    return (
                      <span
                        key={cell.date}
                        className={cn("w-3.5 h-3.5 rounded-[3px]", bg)}
                        title={cell.date}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
