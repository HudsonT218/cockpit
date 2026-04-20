import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { energyLabels } from "@/lib/utils";
import type { EnergyTag, Recurrence, TaskStatus } from "@/lib/types";
import { Check, Circle, CircleDot, Trash2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

const statusOptions: { value: TaskStatus; label: string; icon: any; color: string }[] = [
  { value: "todo", label: "Next", icon: Circle, color: "text-ink-400" },
  { value: "doing", label: "Now", icon: CircleDot, color: "text-accent-amber" },
  { value: "done", label: "Done", icon: Check, color: "text-emerald-400" },
];

export default function TaskDialog({
  open,
  onClose,
  taskId,
}: {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
}) {
  const task = useStore((s) =>
    taskId ? s.tasks.find((t) => t.id === taskId) ?? null : null
  );
  const projects = useStore((s) => s.projects);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task?.id, open]);

  if (!task) return null;

  const blurField = async <K extends "title" | "description">(
    field: K,
    value: string
  ) => {
    if (value === (task[field] ?? "")) return;
    await updateTask(task.id, { [field]: value });
  };

  const linkedProject = task.projectId
    ? projects.find((p) => p.id === task.projectId)
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Task" width={560}>
      {/* status row */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-ink-950 border border-ink-800 rounded-lg">
        {statusOptions.map((opt) => {
          const isActive = task.status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() =>
                updateTask(task.id, {
                  status: opt.value,
                  completedAt:
                    opt.value === "done"
                      ? new Date().toISOString()
                      : undefined,
                })
              }
              className={
                "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition " +
                (isActive
                  ? "bg-ink-800 text-ink-50"
                  : "text-ink-400 hover:text-ink-100")
              }
            >
              <opt.icon className={"w-3 h-3 " + (isActive ? opt.color : "")} />
              {opt.label}
            </button>
          );
        })}
      </div>

      <FormRow label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => blurField("title", title)}
          className={inputCls()}
        />
      </FormRow>

      <FormRow label="Description / notes">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => blurField("description", description)}
          placeholder="Context, subtasks, links, notes…"
          className={`${inputCls()} resize-none h-32 leading-relaxed`}
        />
      </FormRow>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Project">
          <select
            value={task.projectId ?? ""}
            onChange={(e) =>
              updateTask(task.id, { projectId: e.target.value || undefined })
            }
            className={inputCls()}
          >
            <option value="">No project</option>
            {projects
              .filter((p) => p.state !== "shipped")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </FormRow>
        <FormRow label="Energy">
          <select
            value={task.energyTag ?? ""}
            onChange={(e) =>
              updateTask(task.id, {
                energyTag: (e.target.value || undefined) as EnergyTag | undefined,
              })
            }
            className={inputCls()}
          >
            <option value="">—</option>
            {Object.entries(energyLabels).map(([k, v]: any) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </FormRow>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Scheduled for">
          <input
            type="date"
            value={task.scheduledFor ?? ""}
            onChange={(e) =>
              updateTask(task.id, {
                scheduledFor: e.target.value || undefined,
              })
            }
            className={inputCls()}
          />
        </FormRow>
        <FormRow label="Due date">
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) =>
              updateTask(task.id, { dueDate: e.target.value || undefined })
            }
            className={inputCls()}
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Estimate (minutes)">
          <input
            type="number"
            min={0}
            step={5}
            value={task.timeEstimate ?? ""}
            onChange={(e) =>
              updateTask(task.id, {
                timeEstimate: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={inputCls()}
          />
        </FormRow>
        <FormRow label="Recurrence">
          <select
            value={task.recurrence}
            onChange={(e) =>
              updateTask(task.id, {
                recurrence: e.target.value as Recurrence,
              })
            }
            className={inputCls()}
          >
            <option value="none">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </FormRow>
      </div>

      {linkedProject && (
        <div className="mt-4 p-3 bg-ink-950/60 border border-ink-800 rounded-lg flex items-center gap-2 text-xs">
          <LinkIcon className="w-3 h-3 text-ink-500" />
          <span className="text-ink-500">Jump to</span>
          <Link
            to={`/projects/${linkedProject.id}`}
            onClick={onClose}
            className="ml-auto font-medium hover:underline"
            style={{ color: linkedProject.accentColor }}
          >
            {linkedProject.name} →
          </Link>
        </div>
      )}

      <ModalActions>
        <button
          onClick={async () => {
            await deleteTask(task.id);
            onClose();
          }}
          className="mr-auto inline-flex items-center gap-1 px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition"
        >
          Done
        </button>
      </ModalActions>
    </Modal>
  );
}
