import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn, energyLabels } from "@/lib/utils";
import { Check, Clock, Repeat, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import TaskDialog from "./dialogs/TaskDialog";

export default function TaskItem({
  task,
  hideProject = false,
  compact = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  hideProject?: boolean;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const projects = useStore((s) => s.projects);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const project = task.projectId
    ? projects.find((p) => p.id === task.projectId)
    : null;
  const isDone = task.status === "done";
  const energy = task.energyTag ? energyLabels[task.energyTag] : null;
  const hasDescription = !!task.description?.trim();

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setDialogOpen(true)}
        className={cn(
          "group flex items-center gap-3 px-3 rounded-lg border border-transparent hover:border-ink-800 hover:bg-ink-900/50 transition cursor-pointer",
          draggable && "active:cursor-grabbing",
          compact ? "py-1.5" : "py-2"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTask(task.id);
          }}
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition",
            isDone
              ? "bg-emerald-500/80 border-emerald-500"
              : "border-ink-600 hover:border-ink-400"
          )}
        >
          {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={cn(
              "text-sm truncate",
              isDone ? "text-ink-500 line-through" : "text-ink-100"
            )}
          >
            {task.title}
          </span>
          {hasDescription && (
            <FileText
              className="w-3 h-3 text-ink-500 shrink-0"
              aria-label="Has notes"
            />
          )}
          {task.recurrence !== "none" && (
            <Repeat className="w-3 h-3 text-ink-500 shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-ink-500 font-mono shrink-0">
          {task.timeEstimate && !compact && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.timeEstimate}m
            </span>
          )}
          {energy && !compact && <span>{energy.icon}</span>}
          {project && !hideProject && (
            <Link
              to={`/projects/${project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-800/60 hover:bg-ink-800 transition"
              style={{ color: project.accentColor }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: project.accentColor }}
              />
              {project.name}
            </Link>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          title="Delete task"
          className="opacity-30 group-hover:opacity-100 text-ink-500 hover:text-rose-400 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        taskId={task.id}
      />
    </>
  );
}
