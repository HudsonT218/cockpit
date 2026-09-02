import { Link } from "react-router-dom";
import type { Habit } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useHabitStore } from "@/lib/habitStore";
import {
  getStreak,
  isLogged,
  LIFE_CADENCE_LABELS,
} from "@/lib/habitSelectors";
import { cn, isoDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

export default function HabitRow({
  habit,
  date,
  accent,
}: {
  habit: Habit;
  date: string;
  accent: AccentClasses;
}) {
  const logs = useHabitStore((s) => s.logs);
  const toggleHabitLog = useHabitStore((s) => s.toggleHabitLog);
  const done = isLogged(habit.id, date, logs);
  const streak = getStreak(habit.id, habit, logs, isoDate(new Date()));

  return (
    <div className="group flex items-center gap-3 px-2 md:px-3 py-2 md:py-2 rounded-lg hover:bg-ink-900/50 transition">
      <button
        onClick={() => void toggleHabitLog(habit.id, date)}
        className={cn(
          "rounded-full border flex items-center justify-center shrink-0 transition-colors",
          "w-[26px] h-[26px] md:w-5 md:h-5",
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

      <Link
        to={`/habits/${habit.id}`}
        className="flex-1 flex items-center gap-3 min-w-0"
      >
        <span
          className={cn(
            "flex-1 text-[15px] md:text-sm truncate transition-colors",
            done ? "text-ink-400" : "text-ink-100"
          )}
        >
          {habit.name}
        </span>
        <span className="hidden md:block font-mono text-[11px] text-ink-600 w-20 text-right shrink-0">
          {LIFE_CADENCE_LABELS[habit.cadence]}
        </span>
        <span
          className={cn(
            "font-mono text-[11px] w-14 text-right shrink-0",
            streak > 0 ? accent.text : "text-ink-600"
          )}
        >
          {streak > 0 ? `${streak}d` : "0d"}
        </span>
        <ChevronRight className="hidden md:block w-3.5 h-3.5 text-ink-600 shrink-0" />
      </Link>
    </div>
  );
}
