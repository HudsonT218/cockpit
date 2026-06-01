import type { TrackAccent } from "./types";

// Static map so Tailwind keeps every class (no dynamic `bg-${c}-500`, which the
// JIT compiler would purge). All five resolve today: amber/rose/sky/violet exist
// in the custom `accent` palette and Tailwind defaults; emerald is already used
// across the app (StateBadge, Today) via Tailwind's default palette. No new
// palette colors are introduced.
export interface AccentClasses {
  /** 400-weight text, for labels/streak counts */
  text: string;
  /** 500-weight solid fill, for dots / progress bars / heatmap cells */
  bg: string;
  /** soft 500/10 background + 500/20 border, for pills/chips */
  soft: string;
  /** outer glow ring for a completed milestone dot */
  ring: string;
  /** raw "r,g,b" for inline rgba() (gradients, custom glows) */
  rgb: string;
}

export const ACCENT: Record<TrackAccent, AccentClasses> = {
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500",
    soft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ring: "shadow-[0_0_0_4px_rgba(245,158,11,0.15)]",
    rgb: "245,158,11",
  },
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500",
    soft: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    ring: "shadow-[0_0_0_4px_rgba(244,63,94,0.15)]",
    rgb: "244,63,94",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    soft: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ring: "shadow-[0_0_0_4px_rgba(16,185,129,0.15)]",
    rgb: "16,185,129",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500",
    soft: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    ring: "shadow-[0_0_0_4px_rgba(14,165,233,0.15)]",
    rgb: "14,165,233",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500",
    soft: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    ring: "shadow-[0_0_0_4px_rgba(139,92,246,0.15)]",
    rgb: "139,92,246",
  },
};

export const ACCENT_OPTIONS = Object.keys(ACCENT) as TrackAccent[];

export function accentOf(accent: TrackAccent | undefined): AccentClasses {
  return ACCENT[accent ?? "amber"] ?? ACCENT.amber;
}
