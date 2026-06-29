import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Project, WorkSession } from "@/lib/types";
import { cn, formatDuration, formatDate } from "@/lib/utils";
import { exportSessionsCsv, sessionMinutes } from "@/lib/exportHours";
import SessionDialog from "@/components/dialogs/SessionDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { Clock, Play, Square, Download, Pencil, Trash2 } from "lucide-react";

// Re-render on an interval while `active`, so live timers tick.
function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

// Clock-style elapsed: "1:23:45" / "23:45".
function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HoursPanel({ project }: { project: Project }) {
  const allSessions = useStore((s) => s.workSessions);
  const clockIn = useStore((s) => s.clockIn);
  const clockOut = useStore((s) => s.clockOut);
  const deleteWorkSession = useStore((s) => s.deleteWorkSession);

  const sessions = useMemo(
    () => allSessions.filter((w) => w.projectId === project.id),
    [allSessions, project.id]
  );
  const open = sessions.find((w) => !w.endedAt) ?? null;
  const completed = useMemo(
    () =>
      sessions
        .filter((w) => w.endedAt)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [sessions]
  );
  const totalMinutes = completed.reduce((sum, s) => sum + sessionMinutes(s), 0);

  const now = useNow(!!open);
  const elapsedMs = open ? now - new Date(open.startedAt).getTime() : 0;

  const [editing, setEditing] = useState<WorkSession | null>(null);
  const [deleting, setDeleting] = useState<WorkSession | null>(null);

  return (
    <section className="col-span-12 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono flex items-center gap-2">
          <Clock className="w-3 h-3" /> Hours
          <span className="text-ink-300 normal-case tracking-normal text-xs ml-1">
            {formatDuration(totalMinutes)} total
          </span>
        </div>
        <button
          onClick={() => exportSessionsCsv(project, sessions)}
          disabled={completed.length === 0}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-ink-800 rounded-lg text-ink-300 hover:bg-ink-800 transition disabled:opacity-40"
        >
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>

      {/* Clock in / out */}
      <button
        onClick={() => (open ? clockOut(project.id) : clockIn(project.id))}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
          open
            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
            : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
        )}
      >
        {open ? (
          <>
            <Square className="w-3.5 h-3.5" /> Clock out
            <span className="font-mono tabular-nums">{fmtElapsed(elapsedMs)}</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> Clock in
          </>
        )}
      </button>
      {open && (
        <div className="text-[11px] text-ink-500 font-mono mt-2">
          In progress · started {timeOf(open.startedAt)}
        </div>
      )}

      {/* Session list */}
      <div className="mt-5 space-y-1.5">
        {completed.length === 0 && !open && (
          <div className="text-sm text-ink-500 italic">
            No sessions yet — clock in to start tracking.
          </div>
        )}
        {completed.map((s) => (
          <div
            key={s.id}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-800 bg-ink-950/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-mono text-ink-100">
                  {formatDuration(sessionMinutes(s))}
                </span>
                <span className="text-ink-400">{formatDate(s.startedAt)}</span>
                <span className="text-ink-500">
                  {timeOf(s.startedAt)} – {timeOf(s.endedAt as string)}
                </span>
              </div>
              {s.note && (
                <div className="text-xs text-ink-500 truncate mt-0.5">
                  {s.note}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
              <button
                onClick={() => setEditing(s)}
                title="Edit session"
                className="text-ink-500 hover:text-ink-200 p-1.5"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleting(s)}
                title="Delete session"
                className="text-ink-500 hover:text-rose-400 p-1.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <SessionDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        session={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteWorkSession(deleting.id);
        }}
        title="Delete session"
        message="Delete this work session? This can't be undone."
        confirmLabel="Delete"
        danger
      />
    </section>
  );
}
