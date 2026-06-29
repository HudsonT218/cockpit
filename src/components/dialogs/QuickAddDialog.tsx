import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";

// Fast task capture from the mobile FAB — drops into the inbox (or a project).
export default function QuickAddDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addTask = useStore((s) => s.addTask);
  const projects = useStore((s) => s.projects);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setProjectId("");
    }
  }, [open]);

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    onClose();
    await addTask({ title: t, projectId: projectId || undefined });
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick add task" width={420}>
      <FormRow label="Task">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="What needs doing?"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Project (optional)">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={inputCls()}
        >
          <option value="">No project (Inbox)</option>
          {projects
            .filter((p) => p.state !== "shipped")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </FormRow>
      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={() => void submit()}
          disabled={!title.trim()}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          Add task
        </button>
      </ModalActions>
    </Modal>
  );
}
