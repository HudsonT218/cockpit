import type { Project, WorkSession } from "./types";
import { isoDate } from "./utils";
import { slugify } from "./projectTypes";

// Minutes worked in a session (0 for an open/in-progress session).
export function sessionMinutes(s: WorkSession): number {
  if (!s.endedAt) return 0;
  const ms = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
  return Math.max(0, ms / 60000);
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function localTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Build a spreadsheet-friendly CSV of completed sessions for a project,
// with a trailing total row. Open (in-progress) sessions are excluded.
export function buildSessionsCsv(_project: Project, sessions: WorkSession[]): string {
  const completed = sessions
    .filter((s) => s.endedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const header = ["Date", "Clock in", "Clock out", "Hours", "Note"];
  const rows = completed.map((s) => [
    isoDate(new Date(s.startedAt)),
    localTime(s.startedAt),
    localTime(s.endedAt as string),
    (sessionMinutes(s) / 60).toFixed(2),
    s.note ?? "",
  ]);
  const totalHours = completed.reduce((sum, s) => sum + sessionMinutes(s) / 60, 0);

  return [header, ...rows, ["Total", "", "", totalHours.toFixed(2), ""]]
    .map((cols) => cols.map(csvCell).join(","))
    .join("\r\n");
}

// Trigger a browser download of the CSV.
export function exportSessionsCsv(project: Project, sessions: WorkSession[]): void {
  const csv = buildSessionsCsv(project, sessions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(project.name) || "project"}-hours-${isoDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
