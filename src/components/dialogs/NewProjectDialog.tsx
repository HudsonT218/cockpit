import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import type { ProjectState, ProjectType } from "@/lib/types";
import { cn, stateLabels, typeLabels } from "@/lib/utils";

const PALETTE = [
  "#f59e0b",
  "#14b8a6",
  "#8b5cf6",
  "#0ea5e9",
  "#f43f5e",
  "#84cc16",
  "#ec4899",
  "#06b6d4",
];

export default function NewProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addProject = useStore((s) => s.addProject);
  const [name, setName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [type, setType] = useState<ProjectType>("code");
  const [state, setState] = useState<ProjectState>("active");
  const [nextAction, setNextAction] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  useEffect(() => {
    if (open) {
      setName("");
      setOneLiner("");
      setType("code");
      setState("active");
      setNextAction("");
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="New project" width={500}>
      <FormRow label="Name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Side project, Newsletter, Paint kitchen…"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="One-liner">
        <input
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="A single sentence — what is this?"
          className={inputCls()}
        />
      </FormRow>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProjectType)}
            className={inputCls()}
          >
            {(["code", "business", "life"] as ProjectType[]).map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="State">
          <select
            value={state}
            onChange={(e) => setState(e.target.value as ProjectState)}
            className={inputCls()}
          >
            {(
              ["active", "waiting", "on_hold", "idea", "shipped"] as ProjectState[]
            ).map((s) => (
              <option key={s} value={s}>
                {stateLabels[s]}
              </option>
            ))}
          </select>
        </FormRow>
      </div>
      <FormRow label="Next action (optional)">
        <input
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="What's the very next step?"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Accent color">
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 rounded-lg border-2 transition",
                color === c
                  ? "border-ink-100 scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </FormRow>
      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!name.trim()) return;
            addProject({
              name,
              oneLiner,
              type,
              state,
              nextAction: nextAction || undefined,
              accentColor: color,
            });
            onClose();
          }}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          Create
        </button>
      </ModalActions>
    </Modal>
  );
}
