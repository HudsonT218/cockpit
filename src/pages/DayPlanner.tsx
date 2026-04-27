import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  addDays,
  cn,
  energyLabels,
  isoDate,
} from "@/lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Plus,
  FolderKanban,
  AlarmClock,
  Inbox as InboxIcon,
  MapPin,
  CalendarDays,
} from "lucide-react";
import type { Task, TimeBlock, Project, Routine } from "@/lib/types";
import NewBlockDialog from "@/components/dialogs/NewBlockDialog";
import RoutineDialog from "@/components/dialogs/RoutineDialog";
import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_HEIGHT = 64;
const MINUTES_IN_HOURS = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function fmtHour(h: number) {
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${h < 12 ? "a" : "p"}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function minutesToTopPx(totalMin: number) {
  return ((totalMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

export default function DayPlanner() {
  const blocks = useStore((s) => s.blocks);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const calendar = useStore((s) => s.calendar);
  const routines = useStore((s) => s.routines);
  const addBlock = useStore((s) => s.addBlock);
  const updateTask = useStore((s) => s.updateTask);

  const [date, setDate] = useState(isoDate(new Date()));
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const todayISO = isoDate(new Date());
  const isToday = date === todayISO;

  // Auto-scroll timeline to roughly show current time on mount / date change
  useEffect(() => {
    if (!scrollRef.current) return;
    const anchorMin = isToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : 9 * 60; // default anchor at 9am for non-today
    const top = ((anchorMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT - 120;
    scrollRef.current.scrollTop = Math.max(0, top);
  }, [isToday, date]);

  const dayBlocks = useMemo(
    () => blocks.filter((b) => b.date === date).sort((a, b) => a.start.localeCompare(b.start)),
    [blocks, date]
  );

  // Routines that match this day's day-of-week
  const dayOfWeek = new Date(date + "T00:00").getDay();
  const dayRoutines = useMemo(
    () =>
      routines
        .filter((r) => r.daysOfWeek.includes(dayOfWeek))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [routines, dayOfWeek]
  );
  const dayEvents = useMemo(() => {
    // Drop Google events that we already render as our own time blocks.
    const blockGoogleIds = new Set(
      blocks.map((b) => b.googleEventId).filter(Boolean) as string[]
    );
    return calendar
      .filter((e) => e.date === date && !blockGoogleIds.has(e.id))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [calendar, blocks, date]);

  // Task IDs actually booked into a block on this day. We use block existence
  // as the source of truth for "on the day" instead of scheduledFor — which
  // can be stale (left over from a deleted block before the unschedule fix
  // shipped) and silently hide tasks from every section on the page.
  const taskIdsOnDay = useMemo(() => {
    const set = new Set<string>();
    blocks.forEach((b) => {
      if (b.date === date) b.taskIds.forEach((tid) => set.add(tid));
    });
    return set;
  }, [blocks, date]);

  const carryover = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "done" &&
          t.scheduledFor &&
          t.scheduledFor < date &&
          !taskIdsOnDay.has(t.id)
      ),
    [tasks, date, taskIdsOnDay]
  );
  const unscheduled = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "done" &&
          !t.projectId &&
          !(t.scheduledFor && t.scheduledFor < date) &&
          !taskIdsOnDay.has(t.id)
      ),
    [tasks, date, taskIdsOnDay]
  );

  const projectGroups = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.state === "active" || p.state === "waiting" || p.state === "on_hold"
    );
    return activeProjects
      .map((p) => ({
        project: p,
        tasks: tasks.filter(
          (t) =>
            t.projectId === p.id &&
            t.status !== "done" &&
            // past-scheduled goes to carryover instead
            !(t.scheduledFor && t.scheduledFor < date) &&
            // already on a block on this day's timeline
            !taskIdsOnDay.has(t.id)
        ),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [projects, tasks, date, taskIdsOnDay]);

  const scheduleTaskAt = async (taskId: string, startMin: number) => {
    // snap to 15
    startMin = Math.max(DAY_START_HOUR * 60, Math.round(startMin / 15) * 15);
    const endMin = Math.min(DAY_END_HOUR * 60, startMin + 60);
    const task = tasks.find((t) => t.id === taskId);
    await addBlock({
      date,
      start: minutesToTime(startMin),
      end: minutesToTime(endMin),
      label: task?.title ?? "Block",
      energyTag: task?.energyTag,
      projectId: task?.projectId,
      taskIds: [taskId],
    });
    await updateTask(taskId, { scheduledFor: date });
  };

  const onDropOnTimeline = async (e: React.DragEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startMin = DAY_START_HOUR * 60 + Math.floor((y / HOUR_HEIGHT) * 60);
    if (draggingTask) {
      await scheduleTaskAt(draggingTask, startMin);
      setDraggingTask(null);
    } else if (draggingBlock) {
      const block = blocks.find((b) => b.id === draggingBlock);
      if (block) {
        const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
        const newStart = Math.max(DAY_START_HOUR * 60, Math.round(startMin / 15) * 15);
        const newEnd = Math.min(DAY_END_HOUR * 60, newStart + duration);
        await useStore.getState().updateBlock(block.id, {
          date,
          start: minutesToTime(newStart),
          end: minutesToTime(newEnd),
        });
      }
      setDraggingBlock(null);
    }
  };

  const dayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(date + "T00:00"));

  return (
    <div className="p-4 md:p-8 pb-16 max-w-[1600px]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Focus mode · single day
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Plan the day
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(isoDate(addDays(new Date(date + "T00:00"), -1)))}
            className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 rounded transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(todayISO)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition",
              isToday
                ? "border-accent-amber/40 bg-accent-amber/10 text-accent-amber"
                : "border-ink-800 text-ink-300 hover:bg-ink-800"
            )}
          >
            {isToday ? "Today" : "Back to today"}
          </button>
          <button
            onClick={() => setDate(isoDate(addDays(new Date(date + "T00:00"), 1)))}
            className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 rounded transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link
            to="/planner"
            className="ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition"
          >
            <CalendarDays className="w-3 h-3" /> Week view
          </Link>
        </div>
      </div>

      <div className="text-sm text-ink-400 mb-6">{dayLabel}</div>

      <div className="grid grid-cols-12 gap-5">
        {/* LEFT: task pool */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="flex items-center justify-between mb-2 px-1 h-[28px]">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
              Task pool
            </div>
            <span className="text-[10px] font-mono text-ink-600">
              {carryover.length +
                unscheduled.length +
                projectGroups.reduce((n, g) => n + g.tasks.length, 0)}{" "}
              open
            </span>
          </div>

          <div className="space-y-4">
          {/* Carryover */}
          {carryover.length > 0 && (
            <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <SectionHeader
                icon={<AlarmClock className="w-3.5 h-3.5 text-amber-400" />}
                label="Carryover from past days"
                count={carryover.length}
                accent="text-amber-400"
              />
              <div className="space-y-1 mt-2">
                {carryover.map((t) => (
                  <DraggableTask
                    key={t.id}
                    task={t}
                    projects={projects}
                    isDragging={draggingTask === t.id}
                    onStart={() => setDraggingTask(t.id)}
                    onEnd={() => setDraggingTask(null)}
                    showDate
                  />
                ))}
              </div>
            </section>
          )}

          {/* Unscheduled standalone inbox */}
          {unscheduled.length > 0 && (
            <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <SectionHeader
                icon={<InboxIcon className="w-3.5 h-3.5 text-ink-400" />}
                label="Inbox"
                count={unscheduled.length}
              />
              <div className="space-y-1 mt-2">
                {unscheduled.map((t) => (
                  <DraggableTask
                    key={t.id}
                    task={t}
                    projects={projects}
                    isDragging={draggingTask === t.id}
                    onStart={() => setDraggingTask(t.id)}
                    onEnd={() => setDraggingTask(null)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
            <SectionHeader
              icon={<FolderKanban className="w-3.5 h-3.5 text-ink-400" />}
              label="Projects"
              count={projectGroups.length}
            />
            <div className="space-y-2 mt-2">
              {projectGroups.length === 0 && (
                <div className="text-xs text-ink-600 py-2">
                  No open project tasks.
                </div>
              )}
              {projectGroups.map(({ project, tasks: pt }) => {
                const collapsed = collapsedProjects[project.id];
                return (
                  <div key={project.id} className="rounded-lg bg-ink-950/40">
                    <button
                      onClick={() =>
                        setCollapsedProjects((s) => ({ ...s, [project.id]: !collapsed }))
                      }
                      className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ink-800/40 rounded-lg transition"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: project.accentColor }}
                      />
                      <span className="text-xs text-ink-200 flex-1 text-left truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] font-mono text-ink-500">
                        {pt.length}
                      </span>
                      {collapsed ? (
                        <ChevronDown className="w-3 h-3 text-ink-500" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-ink-500" />
                      )}
                    </button>
                    {!collapsed && (
                      <div className="space-y-1 pb-2 px-1">
                        {pt.map((t) => (
                          <DraggableTask
                            key={t.id}
                            task={t}
                            projects={projects}
                            isDragging={draggingTask === t.id}
                            onStart={() => setDraggingTask(t.id)}
                            onEnd={() => setDraggingTask(null)}
                            compact
                            hideProject
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          </div>
        </aside>

        {/* RIGHT: timeline */}
        <main className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="flex items-center justify-between mb-2 px-1 h-[28px]">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
              {dayBlocks.length} {dayBlocks.length === 1 ? "block" : "blocks"} ·{" "}
              {dayRoutines.length}{" "}
              {dayRoutines.length === 1 ? "routine" : "routines"} ·{" "}
              {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setEditingRoutine(null);
                  setRoutineDialogOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-ink-400 hover:text-ink-100 border border-ink-800 rounded-md hover:bg-ink-800 transition"
              >
                <Repeat className="w-3 h-3" />
                Routine
              </button>
              <button
                onClick={() => {
                  setEditingBlock(null);
                  setDialogOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-ink-400 hover:text-ink-100 border border-ink-800 rounded-md hover:bg-ink-800 transition"
              >
                <Plus className="w-3 h-3" />
                New block
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className={cn(
              "rounded-xl border border-ink-800 bg-ink-900/30 overflow-y-auto transition pt-3",
              (draggingTask || draggingBlock) &&
                "border-dashed border-accent-amber/40"
            )}
            style={{ maxHeight: "calc(100vh - 18rem)" }}
          >
          <div
            ref={timelineRef}
            onDragOver={(e) => {
              if (draggingTask || draggingBlock) e.preventDefault();
            }}
            onDrop={onDropOnTimeline}
            className="relative"
            style={{ height: ((DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT) }}
          >
            {/* hour rows */}
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => {
              const h = DAY_START_HOUR + i;
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-ink-800/60"
                  style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                >
                  <div className="absolute left-2 -top-2 text-[10px] font-mono text-ink-600 select-none bg-ink-900 px-1">
                    {fmtHour(h)}
                  </div>
                </div>
              );
            })}

            {/* current-time indicator (only today) */}
            {isToday && <NowLine />}

            {/* calendar events (full width, pinned, read-only) */}
            {dayEvents.map((e) => {
              const startMin = timeToMinutes(e.start);
              const endMin = timeToMinutes(e.end);
              const top = minutesToTopPx(startMin);
              const height = Math.max(
                24,
                ((endMin - startMin) / 60) * HOUR_HEIGHT
              );
              return (
                <div
                  key={e.id}
                  className="absolute left-14 right-[55%] rounded-md bg-ink-800/60 border-l-2 border-ink-500 px-2 py-1 overflow-hidden pointer-events-none"
                  style={{ top, height }}
                >
                  <div className="text-[10px] font-mono text-ink-400">
                    {e.start}
                  </div>
                  <div className="text-xs text-ink-200 truncate">{e.title}</div>
                  {e.location && (
                    <div className="text-[10px] text-ink-500 inline-flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {e.location}
                    </div>
                  )}
                </div>
              );
            })}

            {/* routines (right side, subtle bordered style) */}
            {dayRoutines.map((r) => {
              const startMin = timeToMinutes(r.startTime);
              const endMin = timeToMinutes(r.endTime);
              const top = minutesToTopPx(startMin);
              const height = Math.max(
                26,
                ((endMin - startMin) / 60) * HOUR_HEIGHT
              );
              const proj = r.projectId
                ? projects.find((p) => p.id === r.projectId)
                : null;
              return (
                <div
                  key={`routine-${r.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRoutine(r);
                    setRoutineDialogOpen(true);
                  }}
                  className="absolute left-[48%] right-2 rounded-md bg-accent-amber/[0.05] border border-dashed border-accent-amber/30 px-2.5 py-1.5 cursor-pointer hover:bg-accent-amber/[0.1] hover:border-accent-amber/50 transition overflow-hidden group"
                  style={{ top, height }}
                >
                  {proj && (
                    <div
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                      style={{ background: proj.accentColor }}
                    />
                  )}
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-[10px] font-mono text-accent-amber inline-flex items-center gap-1">
                      <Repeat className="w-2.5 h-2.5" />
                      {r.startTime}–{r.endTime}
                    </span>
                    {r.energyTag && (
                      <span className="text-[10px]">
                        {energyLabels[r.energyTag].icon}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-100 pl-1 line-clamp-2 leading-snug">
                    {r.label}
                  </div>
                </div>
              );
            })}

            {/* blocks (right side) */}
            {dayBlocks.map((b) => {
              const startMin = timeToMinutes(b.start);
              const endMin = timeToMinutes(b.end);
              const top = minutesToTopPx(startMin);
              const height = Math.max(
                26,
                ((endMin - startMin) / 60) * HOUR_HEIGHT
              );
              const proj = b.projectId
                ? projects.find((p) => p.id === b.projectId)
                : null;
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={() => setDraggingBlock(b.id)}
                  onDragEnd={() => setDraggingBlock(null)}
                  onClick={() => {
                    setEditingBlock(b);
                    setDialogOpen(true);
                  }}
                  className={cn(
                    "absolute left-[48%] right-2 rounded-md bg-ink-950/90 border border-ink-700 px-2.5 py-1.5 cursor-pointer hover:border-ink-500 transition overflow-hidden group",
                    draggingBlock === b.id && "opacity-40"
                  )}
                  style={{ top, height }}
                >
                  {proj && (
                    <div
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                      style={{ background: proj.accentColor }}
                    />
                  )}
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-[10px] font-mono text-ink-400">
                      {b.start}–{b.end}
                    </span>
                    {b.energyTag && (
                      <span className="text-[10px]">
                        {energyLabels[b.energyTag].icon}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-100 pl-1 line-clamp-2 leading-snug">
                    {b.label}
                  </div>
                  {proj && height > 50 && (
                    <div
                      className="absolute bottom-1 left-2 text-[10px] font-mono truncate"
                      style={{ color: proj.accentColor }}
                    >
                      {proj.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>

          <div className="mt-3 text-[11px] text-ink-600 font-mono text-center">
            drag tasks from the left onto a time · click a block to edit · drag
            blocks to move
          </div>
        </main>
      </div>

      <NewBlockDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBlock(null);
        }}
        date={date}
        existing={editingBlock}
      />
      <RoutineDialog
        open={routineDialogOpen}
        onClose={() => {
          setRoutineDialogOpen(false);
          setEditingRoutine(null);
        }}
        existing={editingRoutine}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  label,
  count,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.25em] font-mono flex-1",
          accent ?? "text-ink-500"
        )}
      >
        {label}
      </span>
      <span className="text-[10px] font-mono text-ink-500">{count}</span>
    </div>
  );
}

function DraggableTask({
  task,
  projects,
  isDragging,
  onStart,
  onEnd,
  compact = false,
  hideProject = false,
  showDate = false,
}: {
  task: Task;
  projects: Project[];
  isDragging: boolean;
  onStart: () => void;
  onEnd: () => void;
  compact?: boolean;
  hideProject?: boolean;
  showDate?: boolean;
}) {
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  return (
    <div
      draggable
      onDragStart={onStart}
      onDragEnd={onEnd}
      className={cn(
        "group text-left rounded-md border border-ink-800 bg-ink-950/60 cursor-grab active:cursor-grabbing hover:border-ink-700 transition",
        compact ? "px-2 py-1.5" : "px-2.5 py-2",
        isDragging && "opacity-40"
      )}
    >
      <div className="text-xs text-ink-100 leading-snug line-clamp-2">
        {task.title}
      </div>
      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink-500 font-mono">
        {task.timeEstimate && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" /> {task.timeEstimate}m
          </span>
        )}
        {task.energyTag && (
          <span>{energyLabels[task.energyTag].icon}</span>
        )}
        {showDate && task.scheduledFor && (
          <span className="text-amber-500">was {task.scheduledFor.slice(5)}</span>
        )}
        {project && !hideProject && (
          <span
            className="ml-auto truncate max-w-[100px]"
            style={{ color: project.accentColor }}
          >
            {project.name}
          </span>
        )}
      </div>
    </div>
  );
}

function NowLine() {
  const now = new Date();
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < DAY_START_HOUR * 60 || min > DAY_END_HOUR * 60) return null;
  const top = minutesToTopPx(min);
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-accent-amber shadow-[0_0_0_3px_rgba(245,158,11,0.2)] ml-10" />
        <div className="h-px flex-1 bg-accent-amber/60" />
      </div>
    </div>
  );
}
