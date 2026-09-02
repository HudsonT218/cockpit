import type { Habit } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useHabitStore } from "@/lib/habitStore";
import { getWeeklyHeatmap, type HeatmapCell } from "@/lib/habitSelectors";
import { cn, isoDate } from "@/lib/utils";

function cellClass(
  cell: HeatmapCell,
  accentBg: string,
  todayIso: string
): string {
  const base = "w-3.5 h-3.5 rounded-[3px]";
  if (cell.completed) return cn(base, accentBg);
  if (cell.date > todayIso) return cn(base, "bg-ink-900/60");
  if (!cell.due) return cn(base, "bg-ink-900");
  return cn(base, "bg-ink-800");
}

export default function HabitHeatmapStrip({
  habit,
  accent,
}: {
  habit: Habit;
  accent: AccentClasses;
}) {
  const logs = useHabitStore((s) => s.logs);
  const todayIso = isoDate(new Date());
  const weeks = getWeeklyHeatmap(habit.id, habit, logs, 12, todayIso);

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-3.5">
        Last 12 weeks
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={cellClass(cell, accent.bg, todayIso)}
                title={
                  cell.completed
                    ? `${cell.date} · done`
                    : cell.due
                      ? `${cell.date} · missed`
                      : cell.date
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3.5 font-mono text-[10px] text-ink-600">
        <span>less</span>
        <span className="w-[11px] h-[11px] rounded-[2px] bg-ink-900" />
        <span className="w-[11px] h-[11px] rounded-[2px] bg-ink-800" />
        <span
          className="w-[11px] h-[11px] rounded-[2px]"
          style={{ background: `rgba(${accent.rgb},0.45)` }}
        />
        <span className={cn("w-[11px] h-[11px] rounded-[2px]", accent.bg)} />
        <span>more</span>
      </div>
    </div>
  );
}
