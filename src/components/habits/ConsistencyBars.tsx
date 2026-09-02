import type { Habit, HabitCategory } from "@/lib/types";
import { useHabitStore } from "@/lib/habitStore";
import { getKeptRate } from "@/lib/habitSelectors";
import { accentOf } from "@/lib/learningAccent";
import { isoDate } from "@/lib/utils";

export default function ConsistencyBars({
  habits,
  categories,
}: {
  habits: Habit[];
  categories: HabitCategory[];
}) {
  const logs = useHabitStore((s) => s.logs);
  const today = isoDate(new Date());
  const ordered = [...categories].sort((a, b) => a.orderIndex - b.orderIndex);

  const rows = ordered
    .map((cat) => {
      const members = habits.filter((h) => h.categoryId === cat.id);
      if (members.length === 0) return null;
      const rate =
        members.reduce(
          (sum, h) => sum + getKeptRate(h.id, h, logs, 30, today),
          0
        ) / members.length;
      return { cat, pct: Math.round(rate * 100) };
    })
    .filter((r): r is { cat: HabitCategory; pct: number } => r != null);

  const uncategorized = habits.filter((h) => !h.categoryId);
  if (uncategorized.length > 0) {
    const rate =
      uncategorized.reduce(
        (sum, h) => sum + getKeptRate(h.id, h, logs, 30, today),
        0
      ) / uncategorized.length;
    rows.push({
      cat: {
        id: "_none",
        name: "Uncategorized",
        slug: "uncategorized",
        accent: "amber",
        orderIndex: 999,
        createdAt: "",
      },
      pct: Math.round(rate * 100),
    });
  }

  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-[18px]">
      <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-3.5">
        Consistency · 30 days
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-ink-500 py-2">No categories yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const accent = accentOf(row.cat.accent);
            return (
              <div key={row.cat.id}>
                <div className="flex items-center justify-between font-mono text-[11px] text-ink-500 mb-1.5">
                  <span>{row.cat.name}</span>
                  <span className={accent.text}>{row.pct}%</span>
                </div>
                <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className={accent.bg + " h-full rounded-full"}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
