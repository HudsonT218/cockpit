import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function relativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start
  const out = new Date(d);
  out.setDate(d.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(d.getDate() + days);
  return out;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", opts ?? { month: "short", day: "numeric" }).format(
    new Date(iso)
  );
}

export function dayName(d: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
}

export function isoDate(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export const typeLabels: Record<string, string> = {
  code: "Code",
  business: "Business",
  life: "Life",
};

export const stateLabels: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  waiting: "Waiting",
  shipped: "Shipped",
  idea: "Idea",
};

export const energyLabels: Record<string, { label: string; icon: string }> = {
  deep: { label: "Deep", icon: "🔥" },
  thinky: { label: "Thinky", icon: "🧠" },
  grunt: { label: "Grunt", icon: "🛠️" },
  social: { label: "Social", icon: "💬" },
};
