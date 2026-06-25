import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { typeLabelFor } from "@/lib/projectTypes";
import { Code2, Briefcase, Heart, Tag } from "lucide-react";

// Built-in slugs get a dedicated icon; custom + unknown ("Uncategorized")
// slugs fall back to a generic tag icon.
const builtinIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  code: Code2,
  business: Briefcase,
  life: Heart,
};

export default function TypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const projectTypes = useStore((s) => s.projectTypes);
  const Icon = builtinIcons[type] ?? Tag;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-ink-400 font-mono",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {typeLabelFor(type, projectTypes)}
    </span>
  );
}
