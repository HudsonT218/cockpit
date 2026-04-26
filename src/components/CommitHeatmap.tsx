import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Github, RefreshCw } from "lucide-react";
import { cn, isoDate } from "@/lib/utils";

const WEEKS = 12;

function colorFor(count: number) {
  if (count === 0) return "rgba(63, 63, 70, 0.6)"; // ink-600/60
  if (count === 1) return "rgba(16, 185, 129, 0.25)";
  if (count <= 3) return "rgba(16, 185, 129, 0.45)";
  if (count <= 6) return "rgba(16, 185, 129, 0.7)";
  return "rgba(52, 211, 153, 0.95)";
}

export default function CommitHeatmap() {
  const githubUser = useStore((s) => s.githubUser);
  const commitCounts = useStore((s) => s.githubCommitCounts);
  const syncing = useStore((s) => s.githubSyncing);
  const lastSyncedAt = useStore((s) => s.githubLastSyncedAt);
  const syncGithubActivity = useStore((s) => s.syncGithubActivity);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // End column is current week; align end to Saturday
    const daysToSat = 6 - today.getDay();
    const end = new Date(today);
    end.setDate(today.getDate() + daysToSat);
    const start = new Date(end);
    start.setDate(end.getDate() - (WEEKS * 7 - 1));

    const grid: { date: string; count: number; isFuture: boolean }[][] = [];
    let cur = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      const col: typeof grid[number] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = isoDate(cur);
        const isFuture = cur > today;
        col.push({
          date: dateStr,
          count: commitCounts[dateStr] ?? 0,
          isFuture,
        });
        cur.setDate(cur.getDate() + 1);
      }
      grid.push(col);
    }
    return grid;
  }, [commitCounts]);

  const total = useMemo(
    () => Object.values(commitCounts).reduce((a, b) => a + b, 0),
    [commitCounts]
  );

  if (!githubUser) return null;

  const syncedAgo = lastSyncedAt
    ? `synced ${Math.round((Date.now() - lastSyncedAt) / 1000 / 60)}m ago`
    : "not synced";

  return (
    <section className="p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github className="w-3.5 h-3.5 text-ink-400" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
            Commit activity
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-600">
            {syncedAgo}
          </span>
          <button
            onClick={() => syncGithubActivity(true)}
            disabled={syncing}
            title="Refresh"
            className="text-ink-500 hover:text-ink-100 transition disabled:opacity-40"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", syncing && "animate-spin")}
            />
          </button>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                title={
                  day.isFuture
                    ? day.date
                    : `${day.count} commit${day.count === 1 ? "" : "s"} · ${day.date}`
                }
                className="w-3 h-3 rounded-[3px]"
                style={{
                  background: day.isFuture
                    ? "transparent"
                    : colorFor(day.count),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-ink-500">
        <span>
          {total} commits · last {WEEKS} weeks · @{githubUser.login}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-ink-600">less</span>
          {[0, 1, 3, 6, 10].map((n) => (
            <div
              key={n}
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ background: colorFor(n) }}
            />
          ))}
          <span className="text-ink-600">more</span>
        </div>
      </div>
    </section>
  );
}
