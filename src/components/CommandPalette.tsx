import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Inbox,
  CalendarDays,
  Trophy,
  LayoutDashboard,
  Plus,
  Search,
  Upload,
  Database,
  LogOut,
  Settings,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Command {
  id: string;
  label: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
  hint?: string;
}

export default function CommandPalette({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const setFocusProject = useStore((s) => s.setFocusProject);
  const importFromLocalStorage = useStore((s) => s.importFromLocalStorage);
  const loadDemoData = useStore((s) => s.loadDemoData);
  const signOut = useStore((s) => s.signOut);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const base: Command[] = [
      {
        id: "nav-today",
        label: "Go to Today",
        section: "Navigate",
        icon: LayoutDashboard,
        run: () => navigate("/"),
        hint: "T",
      },
      {
        id: "nav-projects",
        label: "Go to Projects",
        section: "Navigate",
        icon: FolderKanban,
        run: () => navigate("/projects"),
      },
      {
        id: "nav-inbox",
        label: "Go to Inbox",
        section: "Navigate",
        icon: Inbox,
        run: () => navigate("/inbox"),
      },
      {
        id: "nav-planner",
        label: "Go to Planner",
        section: "Navigate",
        icon: CalendarDays,
        run: () => navigate("/planner"),
      },
      {
        id: "nav-shipped",
        label: "Go to Shipped wall",
        section: "Navigate",
        icon: Trophy,
        run: () => navigate("/shipped"),
      },
      {
        id: "settings",
        label: "Open settings",
        section: "Actions",
        icon: Settings,
        run: () => onOpenSettings?.(),
      },
      {
        id: "import-ls",
        label: "Import data from localStorage",
        section: "Actions",
        icon: Upload,
        run: async () => {
          const res = await importFromLocalStorage();
          alert(
            res.imported > 0
              ? `Imported ${res.imported} records from localStorage.`
              : "Nothing found in localStorage to import."
          );
        },
      },
      {
        id: "load-demo",
        label: "Load demo data",
        section: "Actions",
        icon: Database,
        run: async () => {
          const res = await loadDemoData();
          alert(`Loaded ${res.imported} demo records.`);
        },
      },
      {
        id: "signout",
        label: "Sign out",
        section: "Actions",
        icon: LogOut,
        run: () => signOut(),
      },
    ];
    const projectCmds: Command[] = projects.map((p) => ({
      id: `focus-${p.id}`,
      label: `Focus: ${p.name}`,
      section: "Set Focus",
      icon: Plus,
      run: () => {
        setFocusProject(p.id);
        navigate("/");
      },
    }));
    const openProject: Command[] = projects.map((p) => ({
      id: `open-${p.id}`,
      label: `Open ${p.name}`,
      section: "Projects",
      icon: FolderKanban,
      run: () => navigate(`/projects/${p.id}`),
    }));
    return [...base, ...projectCmds, ...openProject];
  }, [projects, navigate, setFocusProject, importFromLocalStorage, loadDemoData, signOut, onOpenSettings]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[cursor];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, cursor, onClose]);

  const grouped = useMemo(() => {
    const out: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      out[c.section] = out[c.section] ?? [];
      out[c.section].push(c);
    });
    return out;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[540px] max-w-[92vw] bg-ink-900 border border-ink-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 border-b border-ink-800">
              <Search className="w-4 h-4 text-ink-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                placeholder="Search commands, projects…"
                className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-ink-500"
              />
              <kbd className="font-mono text-[10px] text-ink-500">esc</kbd>
            </div>
            <div className="max-h-[380px] overflow-y-auto py-2">
              {Object.keys(grouped).length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-ink-500">
                  No results
                </div>
              )}
              {Object.entries(grouped).map(([section, items]) => (
                <div key={section} className="mb-2">
                  <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-ink-500 font-mono">
                    {section}
                  </div>
                  {items.map((cmd) => {
                    const idx = filtered.indexOf(cmd);
                    const active = idx === cursor;
                    return (
                      <button
                        key={cmd.id}
                        onMouseEnter={() => setCursor(idx)}
                        onClick={() => {
                          cmd.run();
                          onClose();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-sm",
                          active
                            ? "bg-ink-800 text-ink-50"
                            : "text-ink-300 hover:bg-ink-800/50"
                        )}
                      >
                        <cmd.icon className="w-4 h-4 text-ink-500" />
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {cmd.hint && (
                          <kbd className="font-mono text-[10px] text-ink-500">
                            {cmd.hint}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-ink-800 text-[10px] font-mono text-ink-500 flex items-center gap-3">
              <span>↑↓ navigate</span>
              <span>↵ run</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
