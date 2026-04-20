import { useState, useEffect } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { PauseCircle } from "lucide-react";

export default function ParkDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
}) {
  const projects = useStore((s) => s.projects);
  const setProjectState = useStore((s) => s.setProjectState);
  const project = projects.find((p) => p.id === projectId);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && project) setNote(project.resumeNote ?? "");
  }, [open, project?.id]);

  if (!project) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Park · ${project.name}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <PauseCircle className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-sm text-ink-400 leading-relaxed">
          Parked projects get a resume note so future-you knows why it's on hold
          and when to come back.
        </p>
      </div>
      <FormRow label="Resume note">
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Come back after the flagship ships. Need the case study."
          className={`${inputCls()} resize-none h-24 leading-relaxed`}
        />
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
            setProjectState(project.id, "on_hold", note);
            onClose();
          }}
          className="px-3 py-1.5 text-sm bg-amber-500 text-ink-950 rounded-lg font-medium hover:bg-amber-400 transition"
        >
          Park project
        </button>
      </ModalActions>
    </Modal>
  );
}
