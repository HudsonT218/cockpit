import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Inbox as InboxIcon,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

// Mobile-only thumb nav. Secondary destinations (Week, Shipped, Settings,
// command palette) stay in the hamburger drawer.
const tabs = [
  { to: "/", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/inbox", label: "Inbox", icon: InboxIcon },
  { to: "/day", label: "Plan", icon: CalendarDays },
  { to: "/learning", label: "Learning", icon: GraduationCap },
];

export default function BottomNav() {
  const tasks = useStore((s) => s.tasks);
  const inboxCount = tasks.filter(
    (t) => !t.projectId && t.status !== "done"
  ).length;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t border-ink-800/80 bg-ink-950/95 backdrop-blur"
      style={{ paddingBottom: "min(env(safe-area-inset-bottom), 0.375rem)" }}
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] leading-none font-medium transition",
              isActive
                ? "text-accent-amber"
                : "text-ink-500 hover:text-ink-300"
            )
          }
        >
          <div className="relative">
            <t.icon className="w-[18px] h-[18px]" />
            {t.label === "Inbox" && inboxCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-accent-amber text-ink-950 text-[9px] font-semibold flex items-center justify-center">
                {inboxCount}
              </span>
            )}
          </div>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
