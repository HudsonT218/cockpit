import { useEffect, useMemo, useState } from "react";
import { useHabitStore } from "@/lib/habitStore";
import {
  getHabitsDueOn,
  getStreak,
  isLogged,
} from "@/lib/habitSelectors";
import type { LifeHabitCadence } from "@/lib/types";
import { accentOf } from "@/lib/learningAccent";
import { cn, isoDate } from "@/lib/utils";
import HabitRow from "@/components/habits/HabitRow";
import HabitWeekGrid from "@/components/habits/HabitWeekGrid";
import ConsistencyBars from "@/components/habits/ConsistencyBars";
import HabitDialog from "@/components/dialogs/HabitDialog";
import ManageHabitCategoriesDialog from "@/components/dialogs/ManageHabitCategoriesDialog";
import { motion } from "framer-motion";
import { Plus, Repeat, Sun, Flame, SlidersHorizontal } from "lucide-react";

const CADENCE_CHIPS: { id: LifeHabitCadence | "all"; label: string; mobile: string }[] =
  [
    { id: "all", label: "any cadence", mobile: "any" },
    { id: "daily", label: "daily", mobile: "daily" },
    { id: "weekdays", label: "weekdays", mobile: "weekdays" },
    { id: "weekly", label: "weekly", mobile: "weekly" },
    { id: "monthly", label: "monthly", mobile: "monthly" },
    { id: "custom", label: "custom", mobile: "custom" },
  ];

const chipCls = (active: boolean) =>
  cn(
    "shrink-0 whitespace-nowrap px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider transition",
    active
      ? "bg-ink-700 text-ink-50"
      : "text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
  );

export default function Habits() {
  const categories = useHabitStore((s) => s.categories);
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const loaded = useHabitStore((s) => s.loaded);
  const loadHabits = useHabitStore((s) => s.loadHabits);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [cadFilter, setCadFilter] = useState<LifeHabitCadence | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    void loadHabits(true);
  }, [loadHabits]);

  const today = isoDate(new Date());
  const active = habits.filter((h) => !h.archived);
  const orderedCats = [...categories].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter((h) => {
      if (catFilter !== "all" && h.categoryId !== catFilter) return false;
      if (cadFilter !== "all" && h.cadence !== cadFilter) return false;
      if (q && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [active, catFilter, cadFilter, search]);

  const dueToday = useMemo(
    () => getHabitsDueOn(today, filtered),
    [today, filtered]
  );

  const hasCustom = active.some((h) => h.cadence === "custom");
  const cadenceChips = CADENCE_CHIPS.filter(
    (c) => c.id !== "custom" || hasCustom
  );

  const groups = useMemo(() => {
    const byCat = orderedCats
      .map((cat) => ({
        cat,
        items: dueToday.filter((h) => h.categoryId === cat.id),
      }))
      .filter((g) => g.items.length > 0);
    const uncategorized = dueToday.filter((h) => !h.categoryId);
    if (uncategorized.length > 0) {
      byCat.push({
        cat: {
          id: "_none",
          name: "Uncategorized",
          slug: "uncategorized",
          accent: "amber",
          orderIndex: 999,
          createdAt: "",
        },
        items: uncategorized,
      });
    }
    return byCat;
  }, [orderedCats, dueToday]);

  const doneToday = dueToday.filter((h) => isLogged(h.id, today, logs)).length;
  const bestStreak = active.reduce(
    (max, h) => Math.max(max, getStreak(h.id, h, logs, today)),
    0
  );

  const empty = loaded && active.length === 0;

  return (
    <div className="p-4 md:p-8 pb-16 max-w-[1400px]">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Daily practice
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Habits
            {active.length > 0 && (
              <span className="text-ink-500 font-normal ml-3 text-xl">
                {filtered.length}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-1.5 font-mono text-xs text-accent-amber">
            <Flame className="w-3.5 h-3.5" />
            {bestStreak}
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
          >
            <Plus className="w-4 h-4" /> New habit
          </button>
        </div>
      </div>

      {empty ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-ink-900 border border-ink-800 flex items-center justify-center">
            <Repeat className="w-7 h-7 text-ink-500" />
          </div>
          <div className="text-lg font-medium text-ink-200 mb-1">
            Start your first habit
          </div>
          <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
            Track a daily practice with a checklist, streaks, and a calendar
            heatmap.
          </p>
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
          >
            <Plus className="w-4 h-4" /> New habit
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:flex flex-col gap-2 mb-6 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search habits…"
              className="bg-ink-900 border border-ink-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-ink-600 w-full sm:w-60"
            />
            <div className="h-6 w-px bg-ink-800 mx-1 hidden sm:block" />
            <div className="flex gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setCatFilter("all")}
                className={chipCls(catFilter === "all")}
              >
                all
              </button>
              {orderedCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id)}
                  className={chipCls(catFilter === c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-ink-800 mx-1 hidden sm:block" />
            <div className="flex gap-1 items-center overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {cadenceChips.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCadFilter(c.id)}
                  className={chipCls(cadFilter === c.id)}
                >
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => setManageOpen(true)}
                title="Manage categories"
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="md:hidden mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search habits…"
              className="w-full bg-ink-900 border border-ink-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink-600 mb-3"
            />
            <div className="relative -mx-4 mb-2">
              <div className="flex gap-1.5 overflow-x-auto px-4">
                <button
                  onClick={() => setCatFilter("all")}
                  className={cn(chipCls(catFilter === "all"), "rounded-full py-1.5 min-h-8")}
                >
                  all
                </button>
                {orderedCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCatFilter(c.id)}
                    className={cn(chipCls(catFilter === c.id), "rounded-full py-1.5 min-h-8")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative -mx-4">
              <div className="flex gap-1.5 overflow-x-auto px-4">
                {cadenceChips.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCadFilter(c.id)}
                    className={cn(chipCls(cadFilter === c.id), "rounded-full py-1.5 min-h-8")}
                  >
                    {c.mobile}
                  </button>
                ))}
                <button
                  onClick={() => setManageOpen(true)}
                  title="Manage categories"
                  className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-12 lg:col-span-8 relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/40"
            >
              <div className="absolute inset-0 hero-glow opacity-80" />
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #f59e0b, transparent)",
                }}
              />
              <div className="relative p-3.5 md:p-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Sun className="hidden md:block w-3.5 h-3.5 text-accent-amber" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                      Due today
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px] text-ink-500">
                    <span className="whitespace-nowrap">
                      {doneToday} / {dueToday.length}
                      <span className="hidden md:inline"> done</span>
                    </span>
                    <span className="hidden md:inline-flex items-center gap-1 whitespace-nowrap text-accent-amber">
                      <Flame className="w-3 h-3" />
                      {bestStreak} day streak
                    </span>
                  </div>
                </div>

                {dueToday.length === 0 ? (
                  <div className="text-sm text-ink-500 px-2 py-6">
                    {filtered.length === 0
                      ? "No habits match these filters."
                      : "Nothing due today. Enjoy the breather."}
                  </div>
                ) : (
                  groups.map((g) => {
                    const accent = accentOf(g.cat.accent);
                    return (
                      <div key={g.cat.id} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-3 mb-1.5 px-2">
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", accent.bg)}
                          />
                          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                            {g.cat.name}
                          </div>
                          <div className="h-px flex-1 bg-ink-800" />
                          <div className="hidden md:block text-[10px] font-mono text-ink-600">
                            {g.items.length}
                          </div>
                        </div>
                        {g.items.map((h) => (
                          <HabitRow
                            key={h.id}
                            habit={h}
                            date={today}
                            accent={accent}
                          />
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.section>

            <div className="hidden lg:flex col-span-4 flex-col gap-5">
              <HabitWeekGrid habits={filtered} />
              <ConsistencyBars habits={filtered} categories={orderedCats} />
            </div>
          </div>
        </>
      )}

      <HabitDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <ManageHabitCategoriesDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  );
}
