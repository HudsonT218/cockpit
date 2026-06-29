import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Inbox as InboxIcon,
  CalendarDays,
  CalendarRange,
  Trophy,
  GraduationCap,
  Command,
  Sparkles,
  LogOut,
  X,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import CommandPalette from "./CommandPalette";
import SettingsDialog from "./dialogs/SettingsDialog";
import QuickAddDialog from "./dialogs/QuickAddDialog";
import BottomNav from "./BottomNav";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { to: "/", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/inbox", label: "Inbox", icon: InboxIcon },
  { to: "/day", label: "Plan the day", icon: CalendarDays },
  { to: "/planner", label: "Week", icon: CalendarRange },
  { to: "/shipped", label: "Shipped", icon: Trophy },
];

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const location = useLocation();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const user = useStore((s) => s.user);
  const displayName = useStore((s) => s.displayName);
  const signOut = useStore((s) => s.signOut);
  const loadAll = useStore((s) => s.loadAll);

  // Pull-to-refresh (mobile): pull down at the top of the page to reload data.
  const mainRef = useRef<HTMLElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current =
      (mainRef.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null || refreshing) return;
    if ((mainRef.current?.scrollTop ?? 0) > 0) {
      touchStartY.current = null;
      setPull(0);
      return;
    }
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 80));
  };
  const onTouchEnd = async () => {
    if (touchStartY.current == null) return;
    touchStartY.current = null;
    if (pull > 50 && !refreshing) {
      setRefreshing(true);
      try {
        await loadAll();
      } finally {
        setRefreshing(false);
      }
    }
    setPull(0);
  };
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
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-amber to-accent-rose flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Cockpit</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-amber to-accent-rose text-ink-950 text-[11px] font-semibold flex items-center justify-center"
          aria-label="Open menu"
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
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto overflow-x-hidden relative pt-[calc(3rem_+_env(safe-area-inset-top))] md:pt-0 pb-[calc(3.5rem_+_env(safe-area-inset-bottom))] md:pb-0"
      >
        {(pull > 0 || refreshing) && (
          <div
            className="md:hidden absolute left-0 right-0 flex justify-center z-20 pointer-events-none"
            style={{
              top: `calc(env(safe-area-inset-top) + ${Math.max(
                10,
                pull - 20
              )}px)`,
            }}
          >
            <div className="bg-ink-800/90 border border-ink-700 rounded-full p-2 shadow-lg">
              <RefreshCw
                className={cn(
                  "w-4 h-4 text-ink-200",
                  refreshing && "animate-spin"
                )}
              />
            </div>
          </div>
        )}
        <Outlet />
      </main>

      {/* Mobile quick-capture */}
      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add task"
        className="md:hidden fixed right-4 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-30 w-14 h-14 rounded-full bg-accent-amber text-ink-950 shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <QuickAddDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  );
}
