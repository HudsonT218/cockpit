import { useEffect, useState } from "react";
import Modal, { ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { BUILTIN_TYPE_SLUGS, typeLabelFor } from "@/lib/projectTypes";
import { Plus, Trash2, Lock } from "lucide-react";

export default function ManageTypesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const projectTypes = useStore((s) => s.projectTypes);
  const projects = useStore((s) => s.projects);
  const addProjectType = useStore((s) => s.addProjectType);
  const deleteProjectType = useStore((s) => s.deleteProjectType);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (open) setLabel("");
  }, [open]);

  const add = async () => {
    const name = label.trim();
    if (!name) return;
    setLabel("");
    await addProjectType(name);
  };

  const countFor = (slug: string) =>
    projects.filter((p) => p.type === slug).length;

  return (
    <Modal open={open} onClose={onClose} title="Project types" width={460}>
      <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-2">
        Built-in
      </div>
      <div className="space-y-1.5 mb-5">
        {BUILTIN_TYPE_SLUGS.map((slug) => (
          <div
            key={slug}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-ink-800 bg-ink-900/40"
          >
            <span className="text-sm text-ink-200">
              {typeLabelFor(slug, projectTypes)}
            </span>
            <Lock className="w-3.5 h-3.5 text-ink-600" />
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-2">
        Your types
      </div>
      <div className="space-y-1.5 mb-3">
        {projectTypes.length === 0 && (
          <div className="text-sm text-ink-500 italic px-1 py-2">
            No custom types yet.
          </div>
        )}
        {projectTypes.map((t) => {
          const count = countFor(t.slug);
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-ink-800 bg-ink-900/40"
            >
              <span className="text-sm text-ink-100 truncate">{t.label}</span>
              <div className="flex items-center gap-3 shrink-0">
                {count > 0 && (
                  <span className="text-[10px] font-mono text-ink-600">
                    {count} {count === 1 ? "project" : "projects"}
                  </span>
                )}
                <button
                  onClick={() => deleteProjectType(t.id)}
                  title={
                    count > 0
                      ? `Delete — ${count} project${
                          count === 1 ? "" : "s"
                        } will become Uncategorized`
                      : "Delete type"
                  }
                  className="text-ink-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
          placeholder="Add a type — e.g. Bene Studios"
          className={inputCls()}
        />
        <button
          onClick={() => void add()}
          disabled={!label.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="text-[10px] text-ink-600 font-mono mt-2">
        Deleting a type leaves its projects Uncategorized until you re-assign
        them.
      </div>

      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Done
        </button>
      </ModalActions>
    </Modal>
  );
}
