import { forwardRef, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
// 5-minute granularity gives you anything you realistically need
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

function parse24(v: string) {
  const [h, m] = (v || "00:00").split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { h12, m: isNaN(m) ? 0 : m, period };
}

function format24(h12: number, m: number, period: "AM" | "PM"): string {
  let h: number;
  if (period === "AM") {
    h = h12 === 12 ? 0 : h12;
  } else {
    h = h12 === 12 ? 12 : h12 + 12;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Auto-scroll selected values into view when opened
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const scrollToCenter = (container: HTMLDivElement | null) => {
        if (!container) return;
        const selected = container.querySelector(
          '[data-selected="true"]'
        ) as HTMLElement | null;
        if (selected) {
          container.scrollTop =
            selected.offsetTop - container.clientHeight / 2 + selected.clientHeight / 2;
        }
      };
      scrollToCenter(hourColRef.current);
      scrollToCenter(minColRef.current);
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const { h12, m, period } = parse24(value);
  // snap minutes to nearest 5 for display purposes (doesn't mutate source)
  const snappedM = MINUTES.reduce((prev, cur) =>
    Math.abs(cur - m) < Math.abs(prev - m) ? cur : prev
  );
  const display = `${h12}:${String(m).padStart(2, "0")} ${period}`;

  const setHour = (h: number) => onChange(format24(h, m, period));
  const setMin = (min: number) => onChange(format24(h12, min, period));
  const setPeriod = (p: "AM" | "PM") => onChange(format24(h12, m, p));

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between bg-ink-950 border rounded-lg px-3 py-2 text-sm outline-none transition",
          open
            ? "border-ink-600"
            : "border-ink-800 hover:border-ink-700"
        )}
      >
        <span className="tabular-nums">{display}</span>
        <Clock className="w-3.5 h-3.5 text-ink-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[240px] bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex p-2 gap-1">
            <Column
              ref={hourColRef}
              values={HOURS_12}
              current={h12}
              onPick={setHour}
              format={(v) => String(v)}
            />
            <div className="self-center text-ink-600 text-sm select-none">:</div>
            <Column
              ref={minColRef}
              values={MINUTES}
              current={snappedM}
              onPick={setMin}
              format={(v) => String(v).padStart(2, "0")}
            />
            <div className="flex flex-col gap-1 shrink-0">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-mono font-medium transition",
                    period === p
                      ? "bg-accent-amber/15 text-accent-amber border border-accent-amber/30"
                      : "text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 border border-transparent"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-auto px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-ink-500 hover:text-ink-100 hover:bg-ink-800/60 transition"
              >
                done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Column = forwardRef<
  HTMLDivElement,
  {
    values: number[];
    current: number;
    onPick: (v: number) => void;
    format: (v: number) => string;
  }
>(({ values, current, onPick, format }, ref) => {
  return (
    <div
      ref={ref}
      className="flex-1 h-48 overflow-y-auto flex flex-col gap-0.5 pr-1"
    >
      {values.map((v) => {
        const selected = v === current;
        return (
          <button
            key={v}
            type="button"
            data-selected={selected}
            onClick={() => onPick(v)}
            className={cn(
              "px-2 py-1.5 rounded text-sm font-mono tabular-nums text-center transition shrink-0",
              selected
                ? "bg-accent-amber/15 text-accent-amber border border-accent-amber/30"
                : "text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 border border-transparent"
            )}
          >
            {format(v)}
          </button>
        );
      })}
    </div>
  );
});
Column.displayName = "TimePickerColumn";
