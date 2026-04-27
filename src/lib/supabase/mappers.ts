import type {
  Project,
  Task,
  Decision,
  TimeBlock,
  DayReflection,
  Routine,
} from "../types";

// ---- projects ----
export function projectFromRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    state: r.state,
    oneLiner: r.one_liner ?? "",
    accentColor: r.accent_color ?? "#f59e0b",
    nextAction: r.next_action ?? undefined,
    repoUrl: r.repo_url ?? undefined,
    liveUrl: r.live_url ?? undefined,
    stack: r.stack ?? undefined,
    client: r.client ?? undefined,
    dueDate: r.due_date ?? undefined,
    resumeNote: r.resume_note ?? undefined,
    lastTouchedAt: r.last_touched_at,
    createdAt: r.created_at,
  };
}

export function projectToRow(p: Partial<Project>) {
  const o: any = {};
  if (p.name !== undefined) o.name = p.name;
  if (p.type !== undefined) o.type = p.type;
  if (p.state !== undefined) o.state = p.state;
  if (p.oneLiner !== undefined) o.one_liner = p.oneLiner;
  if (p.accentColor !== undefined) o.accent_color = p.accentColor;
  if (p.nextAction !== undefined) o.next_action = p.nextAction || null;
  if (p.repoUrl !== undefined) o.repo_url = p.repoUrl || null;
  if (p.liveUrl !== undefined) o.live_url = p.liveUrl || null;
  if (p.stack !== undefined) o.stack = p.stack ?? [];
  if (p.client !== undefined) o.client = p.client || null;
  if (p.dueDate !== undefined) o.due_date = p.dueDate || null;
  if (p.resumeNote !== undefined) o.resume_note = p.resumeNote || null;
  if (p.lastTouchedAt !== undefined) o.last_touched_at = p.lastTouchedAt;
  return o;
}

// ---- tasks ----
export function taskFromRow(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status,
    projectId: r.project_id ?? undefined,
    energyTag: r.energy_tag ?? undefined,
    timeEstimate: r.time_estimate ?? undefined,
    scheduledFor: r.scheduled_for ?? undefined,
    recurrence: r.recurrence ?? "none",
    dueDate: r.due_date ?? undefined,
    completedAt: r.completed_at ?? undefined,
    createdAt: r.created_at,
  };
}

export function taskToRow(t: Partial<Task>) {
  const o: any = {};
  if (t.title !== undefined) o.title = t.title;
  if (t.description !== undefined) o.description = t.description || null;
  if (t.status !== undefined) o.status = t.status;
  if (t.projectId !== undefined) o.project_id = t.projectId || null;
  if (t.energyTag !== undefined) o.energy_tag = t.energyTag || null;
  if (t.timeEstimate !== undefined) o.time_estimate = t.timeEstimate ?? null;
  if (t.scheduledFor !== undefined) o.scheduled_for = t.scheduledFor || null;
  if (t.recurrence !== undefined) o.recurrence = t.recurrence;
  if (t.dueDate !== undefined) o.due_date = t.dueDate || null;
  if (t.completedAt !== undefined) o.completed_at = t.completedAt || null;
  return o;
}

// ---- decisions ----
export function decisionFromRow(r: any): Decision {
  return {
    id: r.id,
    projectId: r.project_id,
    date: r.date,
    what: r.what,
    why: r.why ?? "",
  };
}

// ---- time blocks ----
// Row is expected to join `time_block_tasks(task_id)` as `task_ids`.
export function blockFromRow(r: any): TimeBlock {
  const taskIds: string[] = (r.time_block_tasks ?? [])
    .map((j: any) => j.task_id)
    .filter(Boolean);
  return {
    id: r.id,
    date: r.date,
    start: (r.start_time as string).slice(0, 5),
    end: (r.end_time as string).slice(0, 5),
    label: r.label,
    energyTag: r.energy_tag ?? undefined,
    projectId: r.project_id ?? undefined,
    taskIds,
  };
}

export function blockToRow(b: Partial<TimeBlock>) {
  const o: any = {};
  if (b.date !== undefined) o.date = b.date;
  if (b.start !== undefined) o.start_time = b.start;
  if (b.end !== undefined) o.end_time = b.end;
  if (b.label !== undefined) o.label = b.label;
  if (b.energyTag !== undefined) o.energy_tag = b.energyTag || null;
  if (b.projectId !== undefined) o.project_id = b.projectId || null;
  return o;
}


// ---- reflections ----
export function reflectionFromRow(r: any): DayReflection {
  return { date: r.date, text: r.text ?? "" };
}

// ---- routines ----
export function routineFromRow(r: any): Routine {
  return {
    id: r.id,
    label: r.label,
    startTime: (r.start_time as string).slice(0, 5),
    endTime: (r.end_time as string).slice(0, 5),
    daysOfWeek: r.days_of_week ?? [],
    projectId: r.project_id ?? undefined,
    energyTag: r.energy_tag ?? undefined,
  };
}

export function routineToRow(r: Partial<Routine>) {
  const o: any = {};
  if (r.label !== undefined) o.label = r.label;
  if (r.startTime !== undefined) o.start_time = r.startTime;
  if (r.endTime !== undefined) o.end_time = r.endTime;
  if (r.daysOfWeek !== undefined) o.days_of_week = r.daysOfWeek;
  if (r.projectId !== undefined) o.project_id = r.projectId || null;
  if (r.energyTag !== undefined) o.energy_tag = r.energyTag || null;
  return o;
}
