import type { DailyHabit, HabitCompletion, Milestone, HabitCadence } from "./types";
import { isoDate, startOfWeek, addDays } from "./utils";

// Parse "YYYY-MM-DD" at LOCAL midnight. `new Date("YYYY-MM-DD")` parses as UTC,
// which in a negative-offset timezone lands on the previous local day and yields
// the wrong getDay() — that would silently break every cadence/streak/heatmap
// calculation. Always go through this helper for date math here.
function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Day N" since a track's start date, inclusive (start day === Day 1). */
export function dayNumber(
  startedOn: string,
  today: string = isoDate(new Date())
): number {
  const start = parseIsoDateLocal(startedOn).getTime();
  const now = parseIsoDateLocal(today).getTime();
  const days = Math.floor((now - start) / 86400000);
  return Math.max(1, days + 1);
}

/** Format a YYYY-MM-DD as e.g. "Jun 1" using local time (not UTC). */
export function formatTrackDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseIsoDateLocal(iso));
}

// 0=Sun .. 6=Sat. See plan Decision 4:
//   mon_thu = Mon–Thu inclusive, mon_wed = Mon + Wed.
const CADENCE_DAYS: Record<Exclude<HabitCadence, "custom">, number[]> = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  mon_thu: [1, 2, 3, 4],
  mon_wed: [1, 3],
  sat_sun: [6, 0],
  sun: [0],
};

/** Whether a habit's cadence makes it "due" on the given YYYY-MM-DD date. */
export function isHabitDueOn(habit: DailyHabit, date: string): boolean {
  const dow = parseIsoDateLocal(date).getDay();
  if (habit.cadence === "custom") return habit.daysOfWeek.includes(dow);
  return CADENCE_DAYS[habit.cadence].includes(dow);
}

/** Active habits due on `date`, optionally scoped to one track, sorted for display. */
export function getActiveHabitsForDate(
  date: string,
  habits: DailyHabit[],
  trackId?: string
): DailyHabit[] {
  return habits
    .filter((h) => h.active)
    .filter((h) => (trackId ? h.trackId === trackId : true))
    .filter((h) => isHabitDueOn(h, date))
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.createdAt.localeCompare(b.createdAt)
    );
}

export function getCompletionForHabitOnDate(
  habitId: string,
  date: string,
  completions: HabitCompletion[]
): HabitCompletion | undefined {
  return completions.find(
    (c) => c.habitId === habitId && c.completedOn === date
  );
}

// Consecutive DUE days back from today that have completions. Non-due days are
// skipped (neither break nor increment). An incomplete *today* doesn't break the
// streak (you may still do it); an earlier incomplete due day does.
export function getStreakForHabit(
  habitId: string,
  habit: DailyHabit,
  completions: HabitCompletion[],
  today: string = isoDate(new Date())
): number {
  const done = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.completedOn)
  );

  let streak = 0;
  let cursor = parseIsoDateLocal(today);
  const MAX_LOOKBACK = 730; // ~2y safety cap

  for (let i = 0; i < MAX_LOOKBACK; i++) {
    const iso = isoDate(cursor);
    const due = isHabitDueOn(habit, iso);

    if (!due) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (done.has(iso)) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    // due but not completed
    if (iso === today) {
      cursor = addDays(cursor, -1); // today still open — don't break
      continue;
    }
    break;
  }
  return streak;
}

/** Fraction (0..1) of a track's milestones that are completed. */
export function getTrackProgress(
  trackId: string,
  milestones: Milestone[]
): number {
  const ms = milestones.filter((m) => m.trackId === trackId);
  if (ms.length === 0) return 0;
  return ms.filter((m) => m.completedAt != null).length / ms.length;
}

/** Fraction (0..1) of a milestone's sub-items that are done. */
export function getMilestoneSubItemProgress(
  milestoneId: string,
  milestones: Milestone[]
): number {
  const m = milestones.find((x) => x.id === milestoneId);
  if (!m || m.subItems.length === 0) return 0;
  return m.subItems.filter((si) => si.done).length / m.subItems.length;
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  completed: boolean;
  minutes?: number;
  due: boolean;
}

// Monday-aligned weeks, oldest → newest, each a 7-cell Mon→Sun array. `due`
// lets the UI render three states: completed (accent), due-but-empty (faint),
// not-due/skipped (barely visible). Includes the current partial week; future
// cells come back completed:false with their real `due` flag.
export function getWeeklyHeatmap(
  habitId: string,
  habit: DailyHabit,
  completions: HabitCompletion[],
  weeksBack: number = 12,
  today: string = isoDate(new Date())
): HeatmapCell[][] {
  const byDate = new Map<string, HabitCompletion>();
  for (const c of completions) {
    if (c.habitId === habitId) byDate.set(c.completedOn, c);
  }

  const currentMonday = startOfWeek(parseIsoDateLocal(today));
  const firstMonday = addDays(currentMonday, -7 * (weeksBack - 1));

  const weeks: HeatmapCell[][] = [];
  for (let w = 0; w < weeksBack; w++) {
    const week: HeatmapCell[] = [];
    const weekStart = addDays(firstMonday, w * 7);
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d);
      const iso = isoDate(day);
      const hit = byDate.get(iso);
      week.push({
        date: iso,
        completed: hit != null,
        minutes: hit?.minutesSpent,
        due: isHabitDueOn(habit, iso),
      });
    }
    weeks.push(week);
  }
  return weeks;
}
