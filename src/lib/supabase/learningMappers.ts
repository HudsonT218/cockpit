import type {
  LearningTrack,
  Milestone,
  DailyHabit,
  HabitCompletion,
  SubItem,
} from "../types";

// ---- learning_tracks ----
export function trackFromRow(r: any): LearningTrack {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    colorAccent: r.color_accent ?? "amber",
    startedOn: r.started_on,
    targetFinishOn: r.target_finish_on ?? undefined,
    archived: r.archived ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function trackToRow(t: Partial<LearningTrack>) {
  const o: any = {};
  if (t.name !== undefined) o.name = t.name;
  if (t.description !== undefined) o.description = t.description || null;
  if (t.colorAccent !== undefined) o.color_accent = t.colorAccent;
  if (t.startedOn !== undefined) o.started_on = t.startedOn || null;
  if (t.targetFinishOn !== undefined) o.target_finish_on = t.targetFinishOn || null;
  if (t.archived !== undefined) o.archived = t.archived;
  return o;
}

// ---- milestones ----
export function milestoneFromRow(r: any): Milestone {
  return {
    id: r.id,
    trackId: r.track_id,
    title: r.title,
    description: r.description ?? undefined,
    orderIndex: r.order_index,
    targetDate: r.target_date ?? undefined,
    completedAt: r.completed_at ?? undefined,
    subItems: (r.sub_items ?? []) as SubItem[],
    createdAt: r.created_at,
  };
}

export function milestoneToRow(m: Partial<Milestone>) {
  const o: any = {};
  if (m.trackId !== undefined) o.track_id = m.trackId;
  if (m.title !== undefined) o.title = m.title;
  if (m.description !== undefined) o.description = m.description || null;
  if (m.orderIndex !== undefined) o.order_index = m.orderIndex;
  if (m.targetDate !== undefined) o.target_date = m.targetDate || null;
  if (m.completedAt !== undefined) o.completed_at = m.completedAt || null;
  if (m.subItems !== undefined) o.sub_items = m.subItems ?? [];
  return o;
}

// ---- daily_habits ----
export function habitFromRow(r: any): DailyHabit {
  return {
    id: r.id,
    trackId: r.track_id,
    name: r.name,
    description: r.description ?? undefined,
    cadence: r.cadence,
    daysOfWeek: r.days_of_week ?? [],
    targetMinutes: r.target_minutes ?? undefined,
    orderIndex: r.order_index,
    active: r.active ?? true,
    createdAt: r.created_at,
  };
}

export function habitToRow(h: Partial<DailyHabit>) {
  const o: any = {};
  if (h.trackId !== undefined) o.track_id = h.trackId;
  if (h.name !== undefined) o.name = h.name;
  if (h.description !== undefined) o.description = h.description || null;
  if (h.cadence !== undefined) o.cadence = h.cadence;
  if (h.daysOfWeek !== undefined) o.days_of_week = h.daysOfWeek ?? [];
  if (h.targetMinutes !== undefined) o.target_minutes = h.targetMinutes ?? null;
  if (h.orderIndex !== undefined) o.order_index = h.orderIndex;
  if (h.active !== undefined) o.active = h.active;
  return o;
}

// ---- habit_completions ----
export function completionFromRow(r: any): HabitCompletion {
  return {
    id: r.id,
    habitId: r.habit_id,
    completedOn: r.completed_on,
    minutesSpent: r.minutes_spent ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

export function completionToRow(c: Partial<HabitCompletion>) {
  const o: any = {};
  if (c.habitId !== undefined) o.habit_id = c.habitId;
  if (c.completedOn !== undefined) o.completed_on = c.completedOn || null;
  if (c.minutesSpent !== undefined) o.minutes_spent = c.minutesSpent ?? null;
  if (c.note !== undefined) o.note = c.note || null;
  return o;
}
