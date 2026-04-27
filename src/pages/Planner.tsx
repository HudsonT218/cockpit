import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  addDays,
  cn,
  dayName,
  energyLabels,
  isoDate,
  startOfWeek,
} from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Clock, Repeat } from "lucide-react";
import type { EnergyTag, TimeBlock, Routine } from "@/lib/types";
import NewBlockDialog from "@/components/dialogs/NewBlockDialog";
import RoutineDialog from "@/components/dialogs/RoutineDialog";

export default function Planner() {
  const blocks = useStore((s) => s.blocks);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const calendar = useStore((s) => s.calendar);
  const routines = useStore((s) => s.routines);
  const addBlock = useStore((s) => s.addBlock);
  const deleteBlock = useStore((s) => s.deleteBlock);
  const assignTaskToBlock = useStore((s) => s.assignTaskToBlock);
  const updateTask = useStore((s) => s.updateTask);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const unscheduledTasks = tasks.filter(
    (t) => !t.scheduledFor && t.status !== "done"
  );

  return (
    <div className="p-8 pb-16 max-w-[1600px]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Shape your week
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Planner</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 rounded transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-300 border border-ink-800 rounded hover:bg-ink-800 transition"
          >
            This week
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 rounded transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Unscheduled pool */}
        <aside className="col-span-12 md:col-span-3 xl:col-span-2">
          <div className="sticky top-0 rounded-xl border border-ink-800 bg-ink-900/40 p-3">
            <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-2 px-1">
              Unscheduled · {unscheduledTasks.length}
            </div>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {unscheduledTasks.length === 0 && (
                <div className="text-[11px] text-ink-600 px-2 py-2">
                  All tasks scheduled.
                </div>
              )}
              {unscheduledTasks.map((t) => {
                const p = t.projectId
                  ? projects.find((pp) => pp.id === t.projectId)
                  : null;
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggingTask(t.id)}
                    onDragEnd={() => setDraggingTask(null)}
                    className={cn(
                      "group text-left text-xs p-2 rounded-lg border border-ink-800 bg-ink-950/60 cursor-grab active:cursor-grabbing hover:border-ink-700 transition",
                      draggingTask === t.id && "opacity-40"
                    )}
                  >
                    <div className="text-ink-100 line-clamp-2">{t.title}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-ink-500 font-mono">
                      {t.timeEstimate && (
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {t.timeEstimate}m
                        </span>
                      )}
                      {t.energyTag && (
                        <span>{energyLabels[t.energyTag].icon}</span>
                      )}
                      {p && (
                        <span
                          className="ml-auto truncate max-w-[80px]"
                          style={{ color: p.accentColor }}
                        >
                          {p.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Week grid */}
        <div className="col-span-12 md:col-span-9 xl:col-span-10">
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const dateISO = isoDate(d);
              const isToday = dateISO === isoDate(new Date());
              const dayBlocks = blocks
                .filter((b) => b.date === dateISO)
                .sort((a, b) => a.start.localeCompare(b.start));
              const blockGoogleIds = new Set(
                dayBlocks
                  .map((b) => b.googleEventId)
                  .filter(Boolean) as string[]
              );
              const dayEvents = calendar
                .filter((e) => e.date === dateISO && !blockGoogleIds.has(e.id))
                .sort((a, b) => a.start.localeCompare(b.start));
              const dow = d.getDay();
              const dayRoutines = routines
                .filter((r) => r.daysOfWeek.includes(dow))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={dateISO}
                  onDragOver={(e) => {
                    if (draggingTask || draggingBlock) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (draggingTask) {
                      // create a 30m block auto-placed at 09:00 or after last block
                      const lastEnd = dayBlocks.length
                        ? dayBlocks[dayBlocks.length - 1].end
                        : "09:00";
                      const [h, m] = lastEnd.split(":").map(Number);
                      const startM = h * 60 + m + (dayBlocks.length ? 15 : 0);
                      const endM = startM + 30;
                      const fmt = (mins: number) =>
                        `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
                          mins % 60
                        ).padStart(2, "0")}`;
                      const taskObj = tasks.find((t) => t.id === draggingTask);
                      const blockId = addBlock({
                        date: dateISO,
                        start: fmt(startM),
                        end: fmt(endM),
                        label: taskObj?.title ?? "Block",
                        energyTag: taskObj?.energyTag,
                        taskIds: [draggingTask],
                        projectId: taskObj?.projectId,
                      });
                      updateTask(draggingTask, { scheduledFor: dateISO });
                      setDraggingTask(null);
                      void blockId;
                    }
                    if (draggingBlock) {
                      // move block to this date
                      const blockToMove = blocks.find(
                        (b) => b.id === draggingBlock
                      );
                      if (blockToMove) {
                        useStore
                          .getState()
                          .updateBlock(draggingBlock, { date: dateISO });
                      }
                      setDraggingBlock(null);
                    }
                  }}
                  className={cn(
                    "rounded-xl border bg-ink-900/30 p-3 min-h-[400px] transition",
                    isToday
                      ? "border-accent-amber/30 bg-accent-amber/[0.02]"
                      : "border-ink-800",
                    (draggingTask || draggingBlock) &&
                      "border-dashed border-ink-600"
                  )}
                >
                  <div className="flex items-baseline justify-between mb-2 px-1">
                    <div>
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-mono",
                          isToday ? "text-accent-amber" : "text-ink-500"
                        )}
                      >
                        {dayName(d)}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-semibold",
                          isToday ? "text-ink-50" : "text-ink-300"
                        )}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingBlock(null);
                        setDialogDate(dateISO);
                      }}
                      title="New block"
                      className="w-6 h-6 flex items-center justify-center rounded-md text-ink-500 hover:text-ink-50 hover:bg-ink-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Calendar events (pinned) */}
                  {dayEvents.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {dayEvents.map((e) => (
                        <div
                          key={e.id}
                          className="text-[10px] px-2 py-1 rounded bg-ink-800/40 border-l-2 border-ink-500"
                        >
                          <div className="font-mono text-ink-500">
                            {e.start}
                          </div>
                          <div className="text-ink-300 truncate">
                            {e.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Routines for this day-of-week */}
                  {dayRoutines.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {dayRoutines.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setEditingRoutine(r);
                            setRoutineDialogOpen(true);
                          }}
                          className="text-[10px] px-2 py-1 rounded bg-accent-amber/[0.06] border border-dashed border-accent-amber/30 cursor-pointer hover:bg-accent-amber/[0.12] transition"
                        >
                          <div className="font-mono text-accent-amber inline-flex items-center gap-1">
                            <Repeat className="w-2.5 h-2.5" />
                            {r.startTime}
                          </div>
                          <div className="text-ink-200 truncate">{r.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Blocks */}
                  <div className="space-y-1.5">
                    {dayBlocks.map((b) => {
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
                            setDialogDate(b.date);
                          }}
                          className={cn(
                            "group relative p-2 rounded-lg bg-ink-950/80 border border-ink-800 cursor-pointer hover:border-ink-700 transition",
                            draggingBlock === b.id && "opacity-40"
                          )}
                        >
                          {proj && (
                            <div
                              className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                              style={{ background: proj.accentColor }}
                            />
                          )}
                          <div className="flex items-center justify-between pl-1 mb-0.5">
                            <span className="text-[10px] font-mono text-ink-400">
                              {b.start}–{b.end}
                            </span>
                            <div className="flex items-center gap-1">
                              {b.energyTag && (
                                <span className="text-[10px]">
                                  {energyLabels[b.energyTag].icon}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-ink-100 pl-1 line-clamp-2 leading-snug">
                            {b.label}
                          </div>
                          {b.taskIds.length > 0 && (
                            <div className="mt-1 pl-1 text-[10px] font-mono text-ink-500">
                              {b.taskIds.length}{" "}
                              {b.taskIds.length === 1 ? "task" : "tasks"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-[11px] text-ink-600 font-mono text-center">
            drag tasks onto a day · click a block to edit · + to add manually
          </div>
        </div>
      </div>

      <NewBlockDialog
        open={dialogDate !== null}
        onClose={() => {
          setDialogDate(null);
          setEditingBlock(null);
        }}
        date={dialogDate ?? isoDate(new Date())}
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
