import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { isoDate } from "@/lib/utils";

export default function DecisionDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const addDecision = useStore((s) => s.addDecision);
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");

  useEffect(() => {
    if (open) {
      setWhat("");
      setWhy("");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Log a decision">
      <FormRow label="What did you decide?">
        <input
          autoFocus
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="Switching from Mapbox to native MapView"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Why?">
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="The tradeoffs and context future-you will need…"
          className={`${inputCls()} resize-none h-20 leading-relaxed`}
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
            if (!what.trim()) return;
            addDecision({
              projectId,
              date: isoDate(new Date()),
              what,
              why,
            });
            onClose();
          }}
          disabled={!what.trim()}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          Log it
        </button>
      </ModalActions>
    </Modal>
  );
}
