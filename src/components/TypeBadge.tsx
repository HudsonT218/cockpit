import { cn, typeLabels } from "@/lib/utils";
import type { ProjectType } from "@/lib/types";
import { Code2, Briefcase, Heart } from "lucide-react";

const icons: Record<ProjectType, React.ComponentType<{ className?: string }>> = {
  code: Code2,
  business: Briefcase,
  life: Heart,
};

export default function TypeBadge({
  type,
  className,
}: {
  type: ProjectType;
  className?: string;
}) {
  const Icon = icons[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-ink-400 font-mono",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {typeLabels[type]}
    </span>
  );
}
