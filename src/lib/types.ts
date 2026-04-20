export type ProjectType = "code" | "business" | "life";
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
}
