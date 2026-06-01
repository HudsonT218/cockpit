import type { DailyHabit } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useLearningStore } from "@/lib/learningStore";
import {
  getWeeklyHeatmap,
  getStreakForHabit,
  type HeatmapCell,
} from "@/lib/learningSelectors";
import { cn, isoDate } from "@/lib/utils";

const today = () => isoDate(new Date());

function cellClass(cell: HeatmapCell, accentBg: string, todayIso: string): string {
  const base = "w-3 h-3 rounded-[2px]";
  if (cell.completed) return cn(base, accentBg);
  if (cell.date > todayIso) return cn(base, "bg-ink-900/60"); // future
  if (!cell.due) return cn(base, "bg-ink-900"); // skipped — cadence didn't apply
  return cn(base, "bg-ink-800"); // due but empty
}

export default function HabitHeatmap({
  habit,
  accent,
}: {
  habit: DailyHabit;
  accent: AccentClasses;
}) {
  const completions = useLearningStore((s) => s.completions);
  const todayIso = today();
  const weeks = getWeeklyHeatmap(habit.id, habit, completions, 12, todayIso);
  const streak = getStreakForHabit(habit.id, habit, completions, todayIso);

  return (
    <div>
      <div className="text-sm text-ink-200 mb-0.5">{habit.name}</div>
      <div className={cn("font-semibold mb-2", accent.text)}>
        <span className="text-2xl">{streak}</span>
        <span className="text-sm font-normal text-ink-400 ml-1.5">
          day streak
        </span>
      </div>
      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={cellClass(cell, accent.bg, todayIso)}
                title={
                  cell.completed
                    ? `${cell.date}${cell.minutes ? ` · ${cell.minutes} min` : " · done"}`
                    : cell.due
                      ? `${cell.date} · missed`
                      : cell.date
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
