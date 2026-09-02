import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHabitStore } from "@/lib/habitStore";
import { accentOf } from "@/lib/learningAccent";
import {
  getStreak,
  getLongestStreak,
  getKeptRate,
  getTotalCheckins,
  getRecentLog,
  habitDayNumber,
  formatIsoLong,
  isLogged,
  LIFE_CADENCE_LABELS,
} from "@/lib/habitSelectors";
import { cn, isoDate } from "@/lib/utils";
import HabitCalendar from "@/components/habits/HabitCalendar";
import HabitHeatmapStrip from "@/components/habits/HabitHeatmapStrip";
import HabitDialog from "@/components/dialogs/HabitDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Archive,
  Trash2,
  Check,
} from "lucide-react";

const SECTION_LABEL =
  "text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono";

export default function HabitDetail() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const loaded = useHabitStore((s) => s.loaded);
  const loadHabits = useHabitStore((s) => s.loadHabits);
  const habits = useHabitStore((s) => s.habits);
  const categories = useHabitStore((s) => s.categories);
  const logs = useHabitStore((s) => s.logs);
  const toggleHabitLog = useHabitStore((s) => s.toggleHabitLog);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!loaded) void loadHabits();
  }, [loaded, loadHabits]);

  const habit = habits.find((h) => h.id === habitId);
  const today = isoDate(new Date());

  if (!habit) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        {loaded ? (
          <div className="text-center py-20 text-ink-500">
            <div className="mb-3">This habit doesn't exist.</div>
            <Link
              to="/habits"
              className="text-ink-300 hover:text-ink-100 text-sm"
            >
              ← Back to Habits
            </Link>
          </div>
        ) : (
          <div className="text-center py-20 text-ink-600 text-sm">Loading…</div>
        )}
      </div>
    );
  }

  const cat = categories.find((c) => c.id === habit.categoryId);
  const accent = accentOf(cat?.accent);
  const doneToday = isLogged(habit.id, today, logs);
  const current = getStreak(habit.id, habit, logs, today);
  const longest = getLongestStreak(habit.id, habit, logs, today);
  const kept30 = Math.round(getKeptRate(habit.id, habit, logs, 30, today) * 100);
  const total = getTotalCheckins(habit.id, logs);
  const recent = getRecentLog(habit, logs, 8, today);

  const stats = [
    { label: "Current", value: String(current), unit: "days", color: true },
    { label: "Longest", value: String(longest), unit: "days", color: false },
    { label: "30-day", value: `${kept30}%`, unit: "kept", color: false },
    { label: "Total", value: String(total), unit: "check-ins", color: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 pb-16 max-w-5xl mx-auto space-y-8"
    >
      <div>
        <Link
          to="/habits"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-500 hover:text-ink-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Habits
        </Link>

        <div className="flex items-start justify-between gap-3 mt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className={cn("w-2.5 h-2.5 rounded-full shrink-0", accent.bg)}
              />
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-50 min-w-0 break-words">
                {habit.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {cat && (
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                    accent.soft
                  )}
                >
                  {cat.name}
                </span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-ink-700 text-ink-400">
                {LIFE_CADENCE_LABELS[habit.cadence]}
              </span>
              {habit.archived && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-ink-700 text-ink-500">
                  Archived
                </span>
              )}
              <span className="hidden md:inline font-mono text-[11px] text-ink-600">
                Started {formatIsoLong(habit.startedOn)} · Day{" "}
                {habitDayNumber(habit.startedOn, today)}
              </span>
            </div>
            {habit.why && (
              <p className="text-ink-400 mt-2 max-w-2xl leading-relaxed text-sm">
                {habit.why}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void toggleHabitLog(habit.id, today)}
              className={cn(
                "hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition",
                doneToday
                  ? cn(accent.soft)
                  : "bg-ink-50 text-ink-950 border-transparent hover:bg-white"
              )}
            >
              {doneToday ? "Done today" : "Mark done today"}
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition"
                aria-label="Habit actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 z-20 w-36 bg-ink-900 border border-ink-700 rounded-lg shadow-xl shadow-black/40 py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-200 hover:bg-ink-800 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await archiveHabit(habit.id, !habit.archived);
                        if (!habit.archived) navigate("/habits");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-200 hover:bg-ink-800 transition"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {habit.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-rose-400 hover:bg-ink-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => void toggleHabitLog(habit.id, today)}
        className={cn(
          "md:hidden w-full min-h-[48px] rounded-xl text-[15px] font-medium border transition",
          doneToday
            ? cn(accent.soft)
            : "bg-ink-50 text-ink-950 border-transparent"
        )}
      >
        {doneToday ? "Done today" : "Mark done today"}
      </button>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border border-ink-800 bg-ink-900/40 p-2.5 md:p-4",
              i === 3 && "hidden md:block"
            )}
          >
            <div className={cn(SECTION_LABEL, "mb-1 md:mb-2 text-[9px] md:text-[10px]")}>
              {stat.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-xl md:text-[28px] font-semibold",
                  stat.color ? accent.text : "text-ink-100"
                )}
              >
                {stat.value}
              </span>
              <span className="hidden md:inline text-[13px] text-ink-500">
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="flex flex-col md:flex-row gap-5 items-start">
        <div className="w-full md:w-auto">
          <HabitCalendar habit={habit} accent={accent} />
        </div>
        <div className="hidden md:flex flex-1 flex-col gap-5 min-w-0">
          <HabitHeatmapStrip habit={habit} accent={accent} />
          <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
            <div className={cn(SECTION_LABEL, "mb-3")}>Recent</div>
            {recent.length === 0 ? (
              <div className="text-sm text-ink-500">No log yet.</div>
            ) : (
              recent.map((row) => (
                <div
                  key={row.date}
                  className="flex items-center gap-3 py-[7px] border-b border-ink-800/60 last:border-0"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                      row.completed ? accent.bg : "bg-ink-800"
                    )}
                  >
                    {row.completed && (
                      <Check className="w-2.5 h-2.5 text-ink-950" strokeWidth={3} />
                    )}
                  </span>
                  <span className="flex-1 text-[13px] text-ink-300">
                    {row.label}
                  </span>
                  <span className="font-mono text-[11px] text-ink-600">
                    {row.completed ? "kept" : "missed"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <HabitDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        existing={habit}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void deleteHabit(habit.id).then(() => navigate("/habits"));
        }}
        title="Delete habit"
        message="This removes the habit and its check-in history. Archive it instead if you want to keep the log."
        confirmLabel="Delete"
        danger
      />
    </motion.div>
  );
}
