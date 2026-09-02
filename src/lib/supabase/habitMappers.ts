import type {
  Habit,
  HabitCategory,
  HabitLog,
  LifeHabitCadence,
  TrackAccent,
} from "../types";

const ACCENTS: TrackAccent[] = ["amber", "rose", "emerald", "sky", "violet"];
const CADENCES: LifeHabitCadence[] = [
  "daily",
  "weekdays",
  "weekly",
  "monthly",
  "custom",
];

function asAccent(v: unknown): TrackAccent {
  return ACCENTS.includes(v as TrackAccent) ? (v as TrackAccent) : "amber";
}

function asCadence(v: unknown): LifeHabitCadence {
  // Old 3x-per-week rows keep their weekday list as custom.
  if (v === "x_per_week") return "custom";
  return CADENCES.includes(v as LifeHabitCadence)
    ? (v as LifeHabitCadence)
    : "daily";
}

function hhmm(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  return String(v).slice(0, 5);
}

// ---- habit_categories ----
export function categoryFromRow(r: any): HabitCategory {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    accent: asAccent(r.accent),
    orderIndex: r.order_index ?? 0,
    createdAt: r.created_at,
  };
}

export function categoryToRow(c: Partial<HabitCategory>) {
  const o: any = {};
  if (c.name !== undefined) o.name = c.name;
  if (c.slug !== undefined) o.slug = c.slug;
  if (c.accent !== undefined) o.accent = c.accent;
  if (c.orderIndex !== undefined) o.order_index = c.orderIndex;
  return o;
}

// ---- habits ----
export function habitFromRow(r: any): Habit {
  return {
    id: r.id,
    categoryId: r.category_id ?? undefined,
    name: r.name,
    why: r.why ?? undefined,
    cadence: asCadence(r.cadence),
    daysOfWeek: r.days_of_week ?? [],
    timesPerWeek: r.times_per_week ?? undefined,
    reminderAt: hhmm(r.reminder_at),
    startedOn: r.started_on,
    archived: r.archived ?? false,
    orderIndex: r.order_index ?? 0,
    createdAt: r.created_at,
  };
}

export function habitToRow(h: Partial<Habit>) {
  const o: any = {};
  if (h.categoryId !== undefined) o.category_id = h.categoryId || null;
  if (h.name !== undefined) o.name = h.name;
  if (h.why !== undefined) o.why = h.why || null;
  if (h.cadence !== undefined) o.cadence = h.cadence;
  if (h.daysOfWeek !== undefined) o.days_of_week = h.daysOfWeek ?? [];
  if (h.timesPerWeek !== undefined) o.times_per_week = h.timesPerWeek ?? null;
  if (h.reminderAt !== undefined) o.reminder_at = h.reminderAt || null;
  if (h.startedOn !== undefined) o.started_on = h.startedOn;
  if (h.archived !== undefined) o.archived = h.archived;
  if (h.orderIndex !== undefined) o.order_index = h.orderIndex;
  return o;
}

// ---- habit_logs ----
export function logFromRow(r: any): HabitLog {
  return {
    id: r.id,
    habitId: r.habit_id,
    completedOn: r.completed_on,
    createdAt: r.created_at,
  };
}

export function logToRow(l: Partial<HabitLog>) {
  const o: any = {};
  if (l.habitId !== undefined) o.habit_id = l.habitId;
  if (l.completedOn !== undefined) o.completed_on = l.completedOn;
  return o;
}
