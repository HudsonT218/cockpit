import type { Habit, HabitLog, LifeHabitCadence } from "./types";
import { isoDate, startOfWeek, addDays } from "./utils";

// Parse "YYYY-MM-DD" at LOCAL midnight. `new Date("YYYY-MM-DD")` parses as UTC,
// which in a negative-offset timezone lands on the previous local day.
function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const LIFE_CADENCE_LABELS: Record<LifeHabitCadence, string> = {
  daily: "daily",
  weekdays: "weekdays",
  weekly: "weekly",
  monthly: "monthly",
  custom: "custom",
};

export const LIFE_CADENCE_PRESETS: Record<
  Exclude<LifeHabitCadence, "custom">,
  number[]
> = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [1, 2, 3, 4, 5],
  weekly: [0],
  monthly: [],
};

const CADENCE_FALLBACK: Record<Exclude<LifeHabitCadence, "custom">, number[]> = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [1, 2, 3, 4, 5],
  weekly: [],
  monthly: [],
};

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "Day N" since startedOn, inclusive (start day === Day 1). */
export function habitDayNumber(
  startedOn: string,
  today: string = isoDate(new Date())
): number {
  const start = parseIsoDateLocal(startedOn).getTime();
  const now = parseIsoDateLocal(today).getTime();
  const days = Math.floor((now - start) / 86400000);
  return Math.max(1, days + 1);
}

export function formatIsoLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseIsoDateLocal(iso));
}

export function formatIsoWeekdayLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseIsoDateLocal(iso));
}

function dueDays(habit: Habit): number[] {
  if (habit.daysOfWeek.length > 0) return habit.daysOfWeek;
  if (habit.cadence === "custom" || habit.cadence === "monthly") return [];
  return CADENCE_FALLBACK[habit.cadence];
}

function monthlyDueDay(startedOn: string, iso: string): boolean {
  const startDay = parseIsoDateLocal(startedOn).getDate();
  const d = parseIsoDateLocal(iso);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() === Math.min(startDay, last);
}

/** Whether a habit's cadence makes it due on the given YYYY-MM-DD date. */
export function appliesOn(habit: Habit, iso: string): boolean {
  if (habit.cadence === "monthly") return monthlyDueDay(habit.startedOn, iso);
  const dow = parseIsoDateLocal(iso).getDay();
  return dueDays(habit).includes(dow);
}

export function isLogged(
  habitId: string,
  iso: string,
  logs: HabitLog[]
): boolean {
  return logs.some((l) => l.habitId === habitId && l.completedOn === iso);
}

export function getHabitsDueOn(iso: string, habits: Habit[]): Habit[] {
  return habits
    .filter((h) => !h.archived)
    .filter((h) => appliesOn(h, iso))
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.name.localeCompare(b.name)
    );
}

export interface HeatmapCell {
  date: string;
  completed: boolean;
  due: boolean;
}

// Consecutive DUE days back from today that have logs. Non-due days are
// skipped (neither break nor increment). An incomplete *today* doesn't break
// the streak; an earlier incomplete due day does.
export function getStreak(
  habitId: string,
  habit: Habit,
  logs: HabitLog[],
  todayIso: string = isoDate(new Date())
): number {
  const done = new Set(
    logs.filter((l) => l.habitId === habitId).map((l) => l.completedOn)
  );

  let streak = 0;
  let cursor = parseIsoDateLocal(todayIso);
  const start = parseIsoDateLocal(habit.startedOn);
  const MAX_LOOKBACK = 730;

  for (let i = 0; i < MAX_LOOKBACK; i++) {
    if (cursor < start) break;
    const iso = isoDate(cursor);
    const due = appliesOn(habit, iso);

    if (!due) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (done.has(iso)) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (iso === todayIso) {
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

export function getLongestStreak(
  habitId: string,
  habit: Habit,
  logs: HabitLog[],
  todayIso: string = isoDate(new Date())
): number {
  const done = new Set(
    logs.filter((l) => l.habitId === habitId).map((l) => l.completedOn)
  );
  let longest = 0;
  let run = 0;
  const start = parseIsoDateLocal(habit.startedOn);
  const end = parseIsoDateLocal(todayIso);
  const MAX = 730;
  let cursor = start;

  for (let i = 0; i < MAX && cursor <= end; i++) {
    const iso = isoDate(cursor);
    if (appliesOn(habit, iso)) {
      if (done.has(iso)) {
        run++;
        if (run > longest) longest = run;
      } else if (iso !== todayIso) {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return Math.max(longest, getStreak(habitId, habit, logs, todayIso));
}

export function getKeptRate(
  habitId: string,
  habit: Habit,
  logs: HabitLog[],
  days: number,
  todayIso: string = isoDate(new Date())
): number {
  const done = new Set(
    logs.filter((l) => l.habitId === habitId).map((l) => l.completedOn)
  );
  let due = 0;
  let kept = 0;
  let cursor = parseIsoDateLocal(todayIso);
  const start = parseIsoDateLocal(habit.startedOn);

  for (let i = 0; i < days; i++) {
    if (cursor < start) break;
    const iso = isoDate(cursor);
    if (appliesOn(habit, iso)) {
      due++;
      if (done.has(iso)) kept++;
    }
    cursor = addDays(cursor, -1);
  }
  return due === 0 ? 0 : kept / due;
}

export function getWeeklyHeatmap(
  habitId: string,
  habit: Habit,
  logs: HabitLog[],
  weeksBack: number = 12,
  todayIso: string = isoDate(new Date())
): HeatmapCell[][] {
  const byDate = new Set(
    logs.filter((l) => l.habitId === habitId).map((l) => l.completedOn)
  );
  const currentMonday = startOfWeek(parseIsoDateLocal(todayIso));
  const firstMonday = addDays(currentMonday, -7 * (weeksBack - 1));

  const weeks: HeatmapCell[][] = [];
  for (let w = 0; w < weeksBack; w++) {
    const week: HeatmapCell[] = [];
    const weekStart = addDays(firstMonday, w * 7);
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d);
      const iso = isoDate(day);
      week.push({
        date: iso,
        completed: byDate.has(iso),
        due: appliesOn(habit, iso),
      });
    }
    weeks.push(week);
  }
  return weeks;
}

export function getThisWeekCells(
  habit: Habit,
  logs: HabitLog[],
  todayIso: string = isoDate(new Date())
): HeatmapCell[] {
  const weeks = getWeeklyHeatmap(habit.id, habit, logs, 1, todayIso);
  return weeks[0] ?? [];
}

export interface MonthCell {
  date: string | null;
  label: string;
  due: boolean;
  completed: boolean;
  future: boolean;
  today: boolean;
}

export function getMonthGrid(
  habit: Habit,
  logs: HabitLog[],
  year: number,
  month: number, // 0-indexed
  todayIso: string = isoDate(new Date())
): MonthCell[] {
  const done = new Set(
    logs.filter((l) => l.habitId === habit.id).map((l) => l.completedOn)
  );
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < lead; i++) {
    cells.push({
      date: null,
      label: "",
      due: false,
      completed: false,
      future: false,
      today: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoDate(new Date(year, month, d));
    cells.push({
      date: iso,
      label: String(d),
      due: appliesOn(habit, iso),
      completed: done.has(iso),
      future: iso > todayIso,
      today: iso === todayIso,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({
        date: null,
        label: "",
        due: false,
        completed: false,
        future: false,
        today: false,
      });
    }
  }
  return cells;
}

export interface RecentLog {
  date: string;
  label: string;
  completed: boolean;
}

export function getRecentLog(
  habit: Habit,
  logs: HabitLog[],
  limit: number = 8,
  todayIso: string = isoDate(new Date())
): RecentLog[] {
  const done = new Set(
    logs.filter((l) => l.habitId === habit.id).map((l) => l.completedOn)
  );
  const out: RecentLog[] = [];
  let cursor = parseIsoDateLocal(todayIso);
  const start = parseIsoDateLocal(habit.startedOn);
  const MAX = 365;

  for (let i = 0; i < MAX && out.length < limit; i++) {
    if (cursor < start) break;
    const iso = isoDate(cursor);
    if (appliesOn(habit, iso)) {
      out.push({
        date: iso,
        label: formatIsoWeekdayLong(iso),
        completed: done.has(iso),
      });
    }
    cursor = addDays(cursor, -1);
  }
  return out;
}

export function getTotalCheckins(habitId: string, logs: HabitLog[]): number {
  return logs.filter((l) => l.habitId === habitId).length;
}
