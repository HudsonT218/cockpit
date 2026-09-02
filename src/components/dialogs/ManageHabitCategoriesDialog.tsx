import { useEffect, useState } from "react";
import Modal, { ModalActions, inputCls } from "../Modal";
import { useHabitStore } from "@/lib/habitStore";
import { ACCENT, ACCENT_OPTIONS } from "@/lib/learningAccent";
import type { TrackAccent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export default function ManageHabitCategoriesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const categories = useHabitStore((s) => s.categories);
  const habits = useHabitStore((s) => s.habits);
  const addCategory = useHabitStore((s) => s.addCategory);
  const updateCategory = useHabitStore((s) => s.updateCategory);
  const deleteCategory = useHabitStore((s) => s.deleteCategory);
  const reorderCategories = useHabitStore((s) => s.reorderCategories);

  const [label, setLabel] = useState("");
  const [accent, setAccent] = useState<TrackAccent>("amber");
  const [renames, setRenames] = useState<Record<string, string>>({});

  const ordered = [...categories].sort((a, b) => a.orderIndex - b.orderIndex);

  useEffect(() => {
    if (!open) return;
    setLabel("");
    setAccent("amber");
    const next: Record<string, string> = {};
    categories.forEach((c) => {
      next[c.id] = c.name;
    });
    setRenames(next);
  }, [open, categories]);

  const add = async () => {
    const name = label.trim();
    if (!name) return;
    setLabel("");
    await addCategory(name, accent);
  };

  const commitRename = (id: string) => {
    const next = (renames[id] ?? "").trim();
    const current = categories.find((c) => c.id === id);
    if (!current || !next || next === current.name) return;
    void updateCategory(id, { name: next });
  };

  const countFor = (id: string) =>
    habits.filter((h) => h.categoryId === id && !h.archived).length;

  return (
    <Modal open={open} onClose={onClose} title="Habit categories" width={460}>
      <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-2">
        Your categories
      </div>
      <div className="space-y-1.5 mb-3">
        {ordered.length === 0 && (
          <div className="text-sm text-ink-500 italic px-1 py-2">
            No categories yet.
          </div>
        )}
        {ordered.map((c, i) => {
          const count = countFor(c.id);
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 px-2 py-2 rounded-lg border border-ink-800 bg-ink-900/40"
            >
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => void reorderCategories(c.id, -1)}
                  disabled={i === 0}
                  className="text-ink-600 hover:text-ink-200 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void reorderCategories(c.id, 1)}
                  disabled={i === ordered.length - 1}
                  className="text-ink-600 hover:text-ink-200 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={renames[c.id] ?? c.name}
                onChange={(e) =>
                  setRenames((s) => ({ ...s, [c.id]: e.target.value }))
                }
                onBlur={() => commitRename(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="flex-1 min-w-0 bg-transparent text-sm text-ink-100 outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                {ACCENT_OPTIONS.map((k) => (
                  <button
                    key={k}
                    onClick={() => void updateCategory(c.id, { accent: k })}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full",
                      ACCENT[k].bg,
                      c.accent === k ? "ring-2 ring-ink-50 ring-offset-1 ring-offset-ink-900" : "opacity-40 hover:opacity-80"
                    )}
                    aria-label={k}
                  />
                ))}
              </div>
              {count > 0 && (
                <span className="text-[10px] font-mono text-ink-600 shrink-0">
                  {count}
                </span>
              )}
              <button
                onClick={() => void deleteCategory(c.id)}
                title={
                  count > 0
                    ? `Delete. ${count} habit${count === 1 ? "" : "s"} will become uncategorized`
                    : "Delete category"
                }
                className="text-ink-500 hover:text-rose-400 transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
          placeholder="Add a category"
          className={inputCls()}
        />
        <div className="flex items-center gap-1 shrink-0">
          {ACCENT_OPTIONS.map((k) => (
            <button
              key={k}
              onClick={() => setAccent(k)}
              className={cn(
                "w-4 h-4 rounded-full",
                ACCENT[k].bg,
                accent === k ? "ring-2 ring-ink-50" : "opacity-40 hover:opacity-80"
              )}
              aria-label={k}
            />
          ))}
        </div>
        <button
          onClick={() => void add()}
          disabled={!label.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="text-[10px] text-ink-600 font-mono mt-2">
        Deleting a category leaves its habits uncategorized until you re-assign
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
