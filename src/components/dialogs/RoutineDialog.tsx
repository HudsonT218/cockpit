import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import type { EnergyTag, Routine } from "@/lib/types";
import { cn, energyLabels } from "@/lib/utils";
import { Repeat, Trash2 } from "lucide-react";
import TimePicker from "../TimePicker";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RoutineDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Routine | null;
}) {
  const projects = useStore((s) => s.projects);
  const addRoutine = useStore((s) => s.addRoutine);
  const updateRoutine = useStore((s) => s.updateRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);

  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([1, 3, 5]); // default M/W/F
  const [energy, setEnergy] = useState<EnergyTag | "">("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setLabel(existing.label);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setDays(existing.daysOfWeek);
      setEnergy(existing.energyTag ?? "");
      setProjectId(existing.projectId ?? "");
    } else {
      setLabel("");
      setStartTime("07:00");
      setEndTime("08:00");
      setDays([1, 3, 5]);
      setEnergy("");
      setProjectId("");
    }
  }, [open, existing]);

  const toggleDay = (d: number) =>
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
    );

  const setPreset = (preset: "weekdays" | "weekend" | "daily" | "clear") => {
    if (preset === "weekdays") setDays([1, 2, 3, 4, 5]);
    if (preset === "weekend") setDays([0, 6]);
    if (preset === "daily") setDays([0, 1, 2, 3, 4, 5, 6]);
    if (preset === "clear") setDays([]);
  };

  const save = async () => {
    if (!label.trim() || days.length === 0) return;
    const payload = {
      label,
      startTime,
      endTime,
      daysOfWeek: days,
      energyTag: (energy || undefined) as EnergyTag | undefined,
      projectId: projectId || undefined,
    };
    if (existing) {
      await updateRoutine(existing.id, payload);
    } else {
      await addRoutine(payload);
    }
    onClose();
  };

  const canSave = label.trim() && days.length > 0 && startTime < endTime;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit routine" : "New routine"}
      width={520}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center shrink-0">
          <Repeat className="w-4 h-4 text-accent-amber" />
        </div>
        <p className="text-sm text-ink-400 leading-relaxed">
          A routine is a time block that auto-appears on your planners for the
          days you pick.
        </p>
      </div>

      <FormRow label="Label">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Workout, morning journal, standup…"
          className={inputCls()}
        />
      </FormRow>

      <FormRow label="Repeats on">
        <div className="flex gap-1.5 mb-2">
          {DAY_LABELS.map((l, i) => {
            const active = days.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                title={DAY_NAMES[i]}
                className={cn(
                  "flex-1 py-2 text-xs font-mono uppercase rounded-lg border transition",
                  active
                    ? "bg-accent-amber/15 border-accent-amber/40 text-accent-amber"
                    : "border-ink-800 text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
                )}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 text-[10px] font-mono">
          {[
            { k: "weekdays", label: "weekdays" },
            { k: "weekend", label: "weekend" },
            { k: "daily", label: "daily" },
            { k: "clear", label: "clear" },
          ].map((p) => (
            <button
              key={p.k}
              onClick={() => setPreset(p.k as any)}
              className="px-2 py-1 rounded text-ink-500 hover:text-ink-100 hover:bg-ink-800/60 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </FormRow>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Start">
          <TimePicker value={startTime} onChange={setStartTime} />
        </FormRow>
        <FormRow label="End">
          <TimePicker value={endTime} onChange={setEndTime} />
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
            {Object.entries(energyLabels).map(([k, v]: any) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Project">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
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

      <ModalActions>
        {existing && (
          <button
            onClick={async () => {
              await deleteRoutine(existing.id);
              onClose();
            }}
            className="mr-auto inline-flex items-center gap-1 px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
          disabled={!canSave}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          {existing ? "Save" : "Create routine"}
        </button>
      </ModalActions>
    </Modal>
  );
}
