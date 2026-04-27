import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Inbox as InboxIcon,
  CalendarDays,
  CalendarRange,
  Trophy,
  Command,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import CommandPalette from "./CommandPalette";
import SettingsDialog from "./dialogs/SettingsDialog";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/inbox", label: "Inbox", icon: InboxIcon },
  { to: "/day", label: "Plan the day", icon: CalendarDays },
  { to: "/planner", label: "Week", icon: CalendarRange },
  { to: "/shipped", label: "Shipped", icon: Trophy },
];

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const user = useStore((s) => s.user);
  const displayName = useStore((s) => s.displayName);
  const signOut = useStore((s) => s.signOut);
  const activeCount = projects.filter((p) => p.state === "active").length;
  const inboxCount = tasks.filter(
    (t) => !t.projectId && t.status !== "done"
  ).length;
  const userLabel = displayName ?? user?.email ?? "You";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950 text-ink-100">
      {/* Mobile top bar (hidden on md+) */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-12 bg-ink-950/95 backdrop-blur border-b border-ink-800/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 -ml-1.5 rounded hover:bg-ink-800/50 text-ink-200 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-amber to-accent-rose flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Cockpit</span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-amber to-accent-rose text-ink-950 text-[11px] font-semibold flex items-center justify-center"
          aria-label="Settings"
        >
          {userLabel.slice(0, 1).toUpperCase()}
        </button>
      </header>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-60 shrink-0 border-r border-ink-800/80 flex flex-col bg-ink-950",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
          "md:static md:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-5 pt-6 pb-5 border-b border-ink-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent-amber to-accent-rose shadow-lg shadow-accent-amber/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Cockpit</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500 font-mono">
                v0.1 · personal
              </div>
            </div>
          </div>
          {/* Close button — mobile drawer only */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1.5 rounded hover:bg-ink-800/50 text-ink-400 transition"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all",
                  isActive
                    ? "bg-ink-800/80 text-ink-50"
                    : "text-ink-400 hover:text-ink-100 hover:bg-ink-800/40"
                )
              }
            >
              <n.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{n.label}</span>
              {n.label === "Projects" && (
                <span className="text-[10px] font-mono text-ink-500 bg-ink-800 px-1.5 py-0.5 rounded">
                  {activeCount}
                </span>
              )}
              {n.label === "Inbox" && inboxCount > 0 && (
                <span className="text-[10px] font-mono text-ink-950 bg-accent-amber px-1.5 py-0.5 rounded font-semibold">
                  {inboxCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-xs text-ink-400 hover:text-ink-100 border border-ink-800 rounded-lg hover:bg-ink-800/50 transition"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Command palette</span>
          <kbd className="font-mono text-[10px] text-ink-500">⌘K</kbd>
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          className="mx-3 mt-3 mb-4 p-2.5 border border-ink-800 rounded-lg flex items-center gap-2 group hover:bg-ink-800/50 hover:border-ink-700 transition text-left"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-amber to-accent-rose text-ink-950 flex items-center justify-center text-[10px] font-semibold shrink-0">
            {userLabel.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-ink-200 truncate">{userLabel}</div>
            <div className="text-[10px] text-ink-600 font-mono">settings</div>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              signOut();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                signOut();
              }
            }}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </span>
        </button>
      </aside>

      <main
        className="flex-1 overflow-y-auto relative pt-12 md:pt-0"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <Outlet />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
