import { useEffect, useState } from "react";
import type { DailyHabit } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useLearningStore } from "@/lib/learningStore";
import { getCompletionForHabitOnDate } from "@/lib/learningSelectors";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function TodayHabitRow({
  habit,
  date,
  accent,
}: {
  habit: DailyHabit;
  date: string;
  accent: AccentClasses;
}) {
  const completions = useLearningStore((s) => s.completions);
  const toggleHabitCompletion = useLearningStore((s) => s.toggleHabitCompletion);
  const setHabitMinutes = useLearningStore((s) => s.setHabitMinutes);

  const completion = getCompletionForHabitOnDate(habit.id, date, completions);
  const done = !!completion;

  const [mins, setMins] = useState<string>(
    completion?.minutesSpent != null ? String(completion.minutesSpent) : ""
  );

  // Keep the input in sync when the completion changes elsewhere (e.g. toggled off)
  useEffect(() => {
    setMins(
      completion?.minutesSpent != null ? String(completion.minutesSpent) : ""
    );
  }, [completion?.id, completion?.minutesSpent]);

  const commitMinutes = () => {
    const trimmed = mins.trim();
    const n = trimmed === "" ? undefined : Math.max(0, parseInt(trimmed, 10));
    if (trimmed !== "" && Number.isNaN(n as number)) return;
    // Only write if the value actually changed
    if ((completion?.minutesSpent ?? undefined) === n) return;
    void setHabitMinutes(habit.id, date, n);
  };

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-900/50 transition">
      <button
        onClick={() => toggleHabitCompletion(habit.id, date)}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
          done
            ? cn(accent.bg, "border-transparent")
            : "border-ink-600 hover:border-ink-400"
        )}
        aria-pressed={done}
        aria-label={done ? "Mark not done" : "Mark done"}
      >
        {done && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          >
            <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />
          </motion.span>
        )}
      </button>

      <span
        className={cn(
          "flex-1 text-sm truncate transition-colors",
          done ? "text-ink-400" : "text-ink-100"
        )}
      >
        {habit.name}
      </span>

      {/* +min logger, revealed on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
        <input
          type="number"
          min={0}
          value={mins}
          onChange={(e) => setMins(e.target.value)}
          onBlur={commitMinutes}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="min"
          className="w-12 bg-ink-950 border border-ink-800 rounded px-1.5 py-0.5 text-[11px] text-ink-200 outline-none focus:border-ink-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {habit.targetMinutes != null && (
        <span className="text-[11px] font-mono text-ink-500 shrink-0 w-12 text-right">
          {habit.targetMinutes} min
        </span>
      )}
    </div>
  );
}
