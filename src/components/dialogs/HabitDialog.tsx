import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useHabitStore } from "@/lib/habitStore";
import type { Habit, LifeHabitCadence, TrackAccent } from "@/lib/types";
import { ACCENT, ACCENT_OPTIONS } from "@/lib/learningAccent";
import { LIFE_CADENCE_PRESETS, ordinal } from "@/lib/habitSelectors";
import { cn, isoDate } from "@/lib/utils";
import { Repeat, Plus, X } from "lucide-react";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CADENCE_SEGMENTS: { id: Exclude<LifeHabitCadence, "custom">; label: string }[] =
  [
    { id: "daily", label: "daily" },
    { id: "weekdays", label: "weekdays" },
    { id: "weekly", label: "weekly" },
    { id: "monthly", label: "monthly" },
  ];

function useIsMd() {
  const [md, setMd] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = () => setMd(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return md;
}

export default function HabitDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Habit | null;
}) {
  const categories = useHabitStore((s) => s.categories);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const addCategory = useHabitStore((s) => s.addCategory);
  const habits = useHabitStore((s) => s.habits);
  const desktop = useIsMd();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [cadence, setCadence] = useState<LifeHabitCadence>("daily");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderAt, setReminderAt] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [why, setWhy] = useState("");
  const [saving, setSaving] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAccent, setNewCatAccent] = useState<TrackAccent>("amber");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name);
      setCategoryId(existing.categoryId ?? "");
      setCadence(existing.cadence);
      setDays(existing.daysOfWeek);
      setReminderAt(existing.reminderAt ?? "");
      setStartedOn(existing.startedOn);
      setWhy(existing.why ?? "");
    } else {
      setName("");
      setCategoryId(categories[0]?.id ?? "");
      setCadence("daily");
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setReminderAt("");
      setStartedOn(isoDate(new Date()));
      setWhy("");
    }
    setSaving(false);
    setNewCatOpen(false);
    setNewCatName("");
    setNewCatAccent("amber");
    // categories is read for the default pick only; do not re-init when a
    // category is added from this dialog (that would wipe the form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const pickCadence = (id: Exclude<LifeHabitCadence, "custom">) => {
    setCadence(id);
    setDays(LIFE_CADENCE_PRESETS[id]);
  };

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

  const canSave =
    name.trim().length > 0 &&
    !saving &&
    (cadence === "monthly" || days.length > 0);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      categoryId: categoryId || undefined,
      cadence,
      daysOfWeek: days,
      reminderAt: reminderAt || undefined,
      startedOn: startedOn || isoDate(new Date()),
      why: why.trim() || undefined,
      archived: existing?.archived ?? false,
      orderIndex: existing?.orderIndex ?? habits.length,
    };
    // Close first so a slow persist cannot trap the dialog. The store write
    // is optimistic; rollback only happens if the row is confirmed missing.
    onClose();
    try {
      if (existing) {
        await updateHabit(existing.id, payload);
      } else {
        await addHabit(payload);
      }
    } catch (err: any) {
      const detail = err?.message ? ` ${err.message}` : "";
      alert(
        `Couldn't save the habit.${detail} If it disappears, refresh. If it stays gone, re-run supabase/migration_habits.sql.`
      );
    }
  };

  const createCategory = async () => {
    const label = newCatName.trim();
    if (!label) return;
    try {
      const id = await addCategory(label, newCatAccent);
      if (id) setCategoryId(id);
      setNewCatOpen(false);
      setNewCatName("");
    } catch {
      alert("Couldn't add that category.");
    }
  };

  const form = (
    <>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center shrink-0">
          <Repeat className="w-4 h-4 text-accent-amber" />
        </div>
        <p className="text-sm text-ink-400 leading-relaxed">
          A habit is a repeating check-in. Pick a category and a cadence, and it
          shows up on the days it applies.
        </p>
      </div>

      <FormRow label="Name">
        <input
          autoFocus={desktop}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Move 30 minutes, read 20 pages…"
          className={cn(inputCls(), "md:py-2 py-3 text-base md:text-sm min-h-[44px] md:min-h-0")}
        />
      </FormRow>

      <FormRow label="Category">
        <div className="flex flex-wrap gap-1.5 md:gap-1.5">
          {categories.map((c) => {
            const active = categoryId === c.id;
            const a = ACCENT[c.accent];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 md:py-1.5 min-h-[44px] md:min-h-0 rounded-lg text-sm border transition",
                  active ? a.soft : "border-ink-700 text-ink-300 hover:bg-ink-800/60"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", a.bg)} />
                {c.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setNewCatOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg text-sm border border-dashed border-ink-700 text-ink-500 hover:text-ink-200 transition"
          >
            <Plus className="w-3 h-3" />
            {desktop ? "New category" : "New"}
          </button>
        </div>
        {newCatOpen && (
          <div className="mt-2 flex flex-col gap-2 p-2.5 rounded-lg border border-ink-800 bg-ink-950">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createCategory();
                }
              }}
              placeholder="Category name"
              className={inputCls()}
            />
            <div className="flex items-center gap-1.5">
              {ACCENT_OPTIONS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNewCatAccent(k)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2",
                    ACCENT[k].bg,
                    newCatAccent === k ? "border-ink-50" : "border-transparent"
                  )}
                  aria-label={k}
                />
              ))}
              <button
                type="button"
                onClick={() => void createCategory()}
                disabled={!newCatName.trim()}
                className="ml-auto px-2.5 py-1 text-xs bg-ink-50 text-ink-950 rounded-md font-medium disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </FormRow>

      <FormRow label="Cadence">
        <div className="grid grid-cols-2 md:flex md:gap-1.5 gap-2 mb-2">
          {CADENCE_SEGMENTS.map((seg) => {
            const active = cadence === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => pickCadence(seg.id)}
                className={cn(
                  "flex-1 py-2 min-h-[44px] md:min-h-0 rounded-lg font-mono text-[11px] uppercase tracking-wider border transition",
                  active
                    ? "bg-accent-amber/15 border-accent-amber/40 text-accent-amber"
                    : "border-ink-800 text-ink-400 hover:text-ink-200 hover:bg-ink-800/60"
                )}
              >
                {seg.label}
              </button>
            );
          })}
        </div>
        {cadence === "monthly" ? (
          <p className="text-sm text-ink-400">
            Due on the{" "}
            {ordinal(
              Math.max(1, parseInt((startedOn || isoDate(new Date())).slice(8, 10), 10))
            )}{" "}
            of each month, matching the start date.
          </p>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-1 md:hidden">
              Repeats on
            </div>
            <div className="flex gap-1.5 mb-2">
              {DAY_LABELS.map((l, i) => {
                const active = days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    title={DAY_NAMES[i]}
                    className={cn(
                      "flex-1 py-2 min-h-[44px] md:min-h-0 text-xs font-mono uppercase rounded-lg border transition",
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
            <div className="hidden md:flex gap-1 text-[10px] font-mono">
              {(
                [
                  { k: "weekdays", label: "weekdays" },
                  { k: "weekend", label: "weekend" },
                  { k: "daily", label: "daily" },
                  { k: "clear", label: "clear" },
                ] as const
              ).map((p) => (
                <button
                  key={p.k}
                  type="button"
                  onClick={() => setPreset(p.k)}
                  className="px-2 py-1 rounded text-ink-500 hover:text-ink-100 hover:bg-ink-800/60 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </FormRow>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Reminder">
          <input
            type="time"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            className={cn(inputCls(), "min-h-[44px] md:min-h-0")}
            style={{ colorScheme: "dark" }}
          />
        </FormRow>
        <FormRow label={desktop ? "Start date" : "Start"}>
          <input
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
            className={cn(inputCls(), "min-h-[44px] md:min-h-0")}
          />
        </FormRow>
      </div>

      {desktop && (
        <FormRow label="Why this habit (optional)">
          <textarea
            rows={2}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="What does keeping this get you?"
            className={cn(inputCls(), "resize-none")}
          />
        </FormRow>
      )}
    </>
  );

  if (!open) return null;

  if (!desktop) {
    return (
      <div
        className="fixed inset-0 z-50 bg-ink-950 flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-ink-800 shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-400 min-h-[44px]"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <span className="text-sm font-medium text-ink-100">
            {existing ? "Edit habit" : "New habit"}
          </span>
          <button
            onClick={() => void save()}
            disabled={!canSave}
            className={cn(
              "text-sm font-medium min-h-[44px]",
              canSave ? "text-accent-amber" : "text-ink-600"
            )}
          >
            Save
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-8">{form}</div>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit habit" : "New habit"}
      width={520}
    >
      {form}
      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={() => void save()}
          disabled={!canSave}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          {existing ? "Save" : "Create habit"}
        </button>
      </ModalActions>
    </Modal>
  );
}
