// Project type is a free-form slug: the built-in slugs ("code" | "business" |
// "life") plus any user-defined slugs from public.project_types.
export type ProjectType = string;
export type ProjectState =
  | "active"
  | "on_hold"
  | "waiting"
  | "shipped"
  | "idea";
export type EnergyTag = "deep" | "thinky" | "grunt" | "social";
export type TaskStatus = "todo" | "doing" | "done";
export type Recurrence = "daily" | "weekly" | "none";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  state: ProjectState;
  oneLiner: string;
  accentColor: string;
  nextAction?: string;
  repoUrl?: string;
  liveUrl?: string;
  stack?: string[];
  client?: string;
  dueDate?: string;
  lastTouchedAt: string;
  createdAt: string;
  resumeNote?: string;
  trackHours?: boolean;
}

// A clock-in / clock-out work session for hour tracking.
// endedAt undefined === currently clocked in (open session).
export interface WorkSession {
  id: string;
  projectId: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  note?: string;
  createdAt: string;
}

// A user-defined custom project type (built-ins code/business/life are not
// stored — see src/lib/projectTypes.ts).
export interface ProjectTypeDef {
  id: string;
  label: string;
  slug: string;
  orderIndex: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId?: string;
  energyTag?: EnergyTag;
  timeEstimate?: number;
  scheduledFor?: string;
  recurrence: Recurrence;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Decision {
  id: string;
  projectId: string;
  date: string;
  what: string;
  why: string;
}

export interface TimeBlock {
  id: string;
  date: string;
  start: string;
  end: string;
  label: string;
  energyTag?: EnergyTag;
  taskIds: string[];
  projectId?: string;
  googleEventId?: string;
}

export interface DayReflection {
  date: string;
  text: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location?: string;
  cockpitBlockId?: string;
}

export interface Routine {
  id: string;
  label: string;
  startTime: string; // HH:MM
  endTime: string;
  daysOfWeek: number[]; // 0=Sun..6=Sat
  projectId?: string;
  energyTag?: EnergyTag;
}

// ---- Learning module ----
export type TrackAccent = "amber" | "rose" | "emerald" | "sky" | "violet";
export type HabitCadence =
  | "daily"
  | "mon_thu"
  | "mon_wed"
  | "sat_sun"
  | "sun"
  | "custom";

export interface SubItem {
  id: string;
  label: string;
  done: boolean;
}

export interface LearningTrack {
  id: string;
  name: string;
  description?: string;
  colorAccent: TrackAccent;
  startedOn: string; // YYYY-MM-DD
  targetFinishOn?: string; // YYYY-MM-DD
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  trackId: string;
  title: string;
  description?: string;
  orderIndex: number;
  targetDate?: string; // YYYY-MM-DD
  completedAt?: string; // ISO; undefined === not complete
  subItems: SubItem[];
  createdAt: string;
}

export interface DailyHabit {
  id: string;
  trackId: string;
  name: string;
  description?: string;
  cadence: HabitCadence;
  daysOfWeek: number[]; // 0=Sun..6=Sat, meaningful only when cadence === "custom"
  targetMinutes?: number;
  orderIndex: number;
  active: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedOn: string; // YYYY-MM-DD
  minutesSpent?: number;
  note?: string;
  createdAt: string;
}
