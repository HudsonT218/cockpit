import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import type { EnergyTag, TimeBlock } from "@/lib/types";
import { energyLabels } from "@/lib/utils";
import TimePicker from "../TimePicker";

export default function NewBlockDialog({
  open,
  onClose,
  date,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  existing?: TimeBlock | null;
}) {
  const addBlock = useStore((s) => s.addBlock);
  const updateBlock = useStore((s) => s.updateBlock);
  const deleteBlock = useStore((s) => s.deleteBlock);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);

  const [label, setLabel] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [energy, setEnergy] = useState<EnergyTag | "">("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setLabel(existing.label);
      setStart(existing.start);
      setEnd(existing.end);
      setEnergy(existing.energyTag ?? "");
      setProjectId(existing.projectId ?? "");
      setTaskId(existing.taskIds[0] ?? "");
    } else {
      setLabel("");
      setStart("09:00");
      setEnd("10:00");
      setEnergy("");
      setProjectId("");
      setTaskId("");
    }
  }, [open, existing]);

  const openTasks = tasks.filter(
    (t) => t.status !== "done" && (!projectId || t.projectId === projectId)
  );

  const save = () => {
    if (!label.trim()) return;
    const payload = {
      date,
      start,
      end,
      label,
      energyTag: (energy || undefined) as EnergyTag | undefined,
      projectId: projectId || undefined,
      taskIds: taskId ? [taskId] : [],
    };
    if (existing) {
      updateBlock(existing.id, payload);
    } else {
      addBlock(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit block" : `New block · ${date}`}
      width={500}
    >
      <FormRow label="Label">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Deep work, client review, admin…"
          className={inputCls()}
        />
      </FormRow>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Start">
          <TimePicker value={start} onChange={setStart} />
        </FormRow>
        <FormRow label="End">
          <TimePicker value={end} onChange={setEnd} />
        </FormRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Energy">
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value as EnergyTag | "")}
            className={inputCls()}
          >
            <option value="">—</option>
            {(Object.entries(energyLabels) as any).map(([k, v]: any) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Project">
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskId("");
            }}
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
      </div>
      <FormRow label="Linked task (optional)">
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className={inputCls()}
        >
          <option value="">None</option>
          {openTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </FormRow>

      <ModalActions>
        {existing && (
          <button
            onClick={() => {
              deleteBlock(existing.id);
              onClose();
            }}
            className="mr-auto px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            Delete
          </button>
        )}
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!label.trim()}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          {existing ? "Save" : "Create block"}
        </button>
      </ModalActions>
    </Modal>
  );
}
