import { useStore } from "@/lib/store";
import { cn, energyLabels, isoDate, relativeTime } from "@/lib/utils";
import TaskItem from "@/components/TaskItem";
import CommitHeatmap from "@/components/CommitHeatmap";
import { motion } from "framer-motion";
import {
  Flame,
  ArrowRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  Flag,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Today() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const blocks = useStore((s) => s.blocks);
  const calendar = useStore((s) => s.calendar);
  const focusProjectId = useStore((s) => s.focusProjectId);
  const reflections = useStore((s) => s.reflections);
  const saveReflection = useStore((s) => s.saveReflection);
  const displayName = useStore((s) => s.displayName);
  const user = useStore((s) => s.user);
  const googleToken = useStore((s) => s.googleToken);
  const googleSyncing = useStore((s) => s.googleSyncing);
  const syncGoogleCalendar = useStore((s) => s.syncGoogleCalendar);

  const today = isoDate(new Date());
  const activeProjects = projects.filter((p) => p.state === "active");
  const focusProject =
    projects.find((p) => p.id === focusProjectId) ?? activeProjects[0];
  const todayBlocks = blocks
    .filter((b) => b.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayEvents = calendar
    .filter((e) => e.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayTasks = tasks.filter(
    (t) => t.scheduledFor === today && t.status !== "done"
  );
  const completedToday = tasks.filter(
    (t) => t.completedAt && t.completedAt.startsWith(today)
  );
  const streak = computeStreak(tasks);
  const currentReflection = reflections.find((r) => r.date === today);

  const now = new Date();
  const greeting =
    now.getHours() < 5
      ? "Up late"
      : now.getHours() < 12
        ? "Good morning"
        : now.getHours() < 17
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      {/* header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(now)}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}
            {displayName || user?.email
              ? `, ${(displayName || user!.email!).split("@")[0].split(" ")[0]}.`
              : "."}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-400">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-accent-amber" />
            <span className="font-mono">{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">
              {completedToday.length} done today
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Focus hero */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="col-span-12 lg:col-span-8 relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/40"
        >
          <div className="absolute inset-0 hero-glow opacity-80" />
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: focusProject
                ? `linear-gradient(90deg, transparent, ${focusProject.accentColor}, transparent)`
                : undefined,
            }}
          />
          <div className="relative p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                Today's focus
              </span>
            </div>
            {focusProject ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: focusProject.accentColor }}
                  />
                  <span
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: focusProject.accentColor }}
                  >
                    {focusProject.name}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink-50 leading-tight mb-2">
                  {focusProject.nextAction ?? "Pick a next action."}
                </h2>
                <p className="text-ink-400 text-base mb-6 max-w-2xl">
                  {focusProject.oneLiner}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/projects/${focusProject.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
                  >
                    Open project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/day"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 text-ink-200 rounded-lg text-sm hover:bg-ink-800 transition"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Plan the day
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-ink-500">Pick an active project to focus.</div>
            )}
          </div>
        </motion.section>

        {/* Calendar sidebar */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="col-span-12 lg:col-span-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-ink-400" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                Calendar
              </span>
            </div>
            {googleToken ? (
              <button
                onClick={() => syncGoogleCalendar()}
                disabled={googleSyncing}
                className="text-[10px] text-ink-500 hover:text-ink-200 font-mono inline-flex items-center gap-1 transition disabled:opacity-40"
                title="Refresh Google Calendar"
              >
                <RefreshCw
                  className={cn(
                    "w-3 h-3",
                    googleSyncing && "animate-spin"
                  )}
                />
                google
              </button>
            ) : (
              <span className="text-[10px] text-ink-600 font-mono">
                not connected
              </span>
            )}
          </div>
          <div className="space-y-2">
            {!googleToken && (
              <div className="text-sm text-ink-500 py-4">
                Connect Google Calendar in settings to see events here.
              </div>
            )}
            {googleToken && todayEvents.length === 0 && (
              <div className="text-sm text-ink-500 py-4">
                Nothing scheduled. Quiet day.
              </div>
            )}
            {todayEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-ink-800/40 transition"
              >
                <div className="text-[11px] font-mono text-ink-500 w-12 shrink-0 pt-0.5">
                  {e.start}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-100 truncate">{e.title}</div>
                  {e.location && (
                    <div className="text-[11px] text-ink-500 inline-flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {e.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Active projects strip */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="col-span-12 lg:col-span-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
              Active projects
            </div>
            <Link
              to="/projects"
              className="text-[11px] text-ink-400 hover:text-ink-100 font-mono"
            >
              view all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {activeProjects.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="group p-4 bg-ink-900/40 border border-ink-800 hover:border-ink-700 rounded-xl transition relative overflow-hidden"
              >
                <div
                  className="absolute -top-px left-0 right-0 h-px opacity-70"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${p.accentColor}, transparent)`,
                  }}
                />
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: p.accentColor }}
                  />
                  <span className="text-xs font-mono text-ink-400 truncate">
                    {p.name}
                  </span>
                </div>
                <div className="text-sm text-ink-200 line-clamp-2 leading-snug mb-3 min-h-[2.5em]">
                  {p.nextAction ?? p.oneLiner}
                </div>
                <div className="text-[10px] font-mono text-ink-500">
                  {relativeTime(p.lastTouchedAt)}
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Today's schedule */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="col-span-12 lg:col-span-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-6"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-4">
            Today's blocks
          </div>
          <div className="space-y-3">
            {todayBlocks.length === 0 && (
              <div className="text-sm text-ink-500">No blocks yet.</div>
            )}
            {todayBlocks.map((b) => {
              const p = projects.find((pr) => pr.id === b.projectId);
              const energy = b.energyTag ? energyLabels[b.energyTag] : null;
              return (
                <div
                  key={b.id}
                  className="relative p-3 rounded-lg bg-ink-950/60 border border-ink-800"
                >
                  {p && (
                    <div
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                      style={{ background: p.accentColor }}
                    />
                  )}
                  <div className="flex items-center justify-between mb-1 pl-1">
                    <span className="text-[11px] font-mono text-ink-400">
                      {b.start} – {b.end}
                    </span>
                    {energy && (
                      <span className="text-[11px]">{energy.icon}</span>
                    )}
                  </div>
                  <div className="text-sm text-ink-100 pl-1">{b.label}</div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Today's tasks */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="col-span-12 lg:col-span-8 rounded-2xl border border-ink-800 bg-ink-900/40 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flag className="w-3.5 h-3.5 text-ink-400" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                Today's tasks
              </span>
            </div>
            <Link
              to="/inbox"
              className="text-[11px] text-ink-400 hover:text-ink-100 font-mono"
            >
              inbox →
            </Link>
          </div>
          <div className="space-y-0.5">
            {todayTasks.length === 0 && (
              <div className="text-sm text-ink-500 py-4">
                Nothing on deck for today. Add something from the inbox.
              </div>
            )}
            {todayTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </motion.section>

        {/* Commit heatmap (only if GitHub connected) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.225 }}
          className="col-span-12"
        >
          <CommitHeatmap />
        </motion.div>

        {/* Reflection */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="col-span-12 lg:col-span-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-6"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-3">
            End-of-day reflection
          </div>
          <textarea
            defaultValue={currentReflection?.text ?? ""}
            onBlur={(e) => saveReflection(today, e.target.value)}
            placeholder="What moved today? What blocked you?"
            className="w-full h-28 resize-none bg-transparent outline-none text-sm text-ink-200 placeholder:text-ink-600 leading-relaxed"
          />
          <div className="mt-2 text-[10px] text-ink-600 font-mono">
            saves on blur
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function computeStreak(tasks: ReturnType<typeof useStore.getState>["tasks"]) {
  const days = new Set<string>();
  tasks.forEach((t) => {
    if (t.completedAt) days.add(t.completedAt.slice(0, 10));
  });
  let streak = 0;
  const cur = new Date();
  while (days.has(isoDate(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  // If today has 0 completed but yesterday had some, keep showing yesterday's streak
  if (streak === 0) {
    cur.setDate(cur.getDate() - 1);
    while (days.has(isoDate(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
  }
  return streak;
}
