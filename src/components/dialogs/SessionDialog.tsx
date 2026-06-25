import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import type { WorkSession } from "@/lib/types";

// ISO <-> <input type="datetime-local"> ("YYYY-MM-DDTHH:mm"), local time.
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function fromLocalInput(val: string): string {
  return new Date(val).toISOString();
}

export default function SessionDialog({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: WorkSession | null;
}) {
  const updateWorkSession = useStore((s) => s.updateWorkSession);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && session) {
      setStart(toLocalInput(session.startedAt));
      setEnd(toLocalInput(session.endedAt));
      setNote(session.note ?? "");
    }
  }, [open, session]);

  if (!session) return null;

  const endBeforeStart =
    !!start && !!end && fromLocalInput(end) <= fromLocalInput(start);

  const save = async () => {
    if (!start || endBeforeStart) return;
    await updateWorkSession(session.id, {
      startedAt: fromLocalInput(start),
      // empty end re-opens the session (clears ended_at)
      endedAt: end ? fromLocalInput(end) : "",
      note,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit session" width={420}>
      <FormRow label="Clock in">
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Clock out (leave empty = still running)">
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className={inputCls()}
        />
      </FormRow>
      {endBeforeStart && (
        <div className="text-xs text-rose-400 -mt-1 mb-2">
          Clock out must be after clock in.
        </div>
      )}
      <FormRow label="Note (optional)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you work on?"
          className={inputCls() + " resize-none h-20"}
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
          onClick={save}
          disabled={!start || endBeforeStart}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          Save
        </button>
      </ModalActions>
    </Modal>
  );
}
