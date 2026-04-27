import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import TaskItem from "@/components/TaskItem";
import StateBadge from "@/components/StateBadge";
import TypeBadge from "@/components/TypeBadge";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Plus,
  Lightbulb,
  Clock,
  ChevronRight,
  Target,
  Pause,
  Play,
  Archive,
  Trash2,
  PauseCircle,
} from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import type { ProjectState, TaskStatus } from "@/lib/types";
import { useState } from "react";
import ParkDialog from "@/components/dialogs/ParkDialog";
import DecisionDialog from "@/components/dialogs/DecisionDialog";
import LinkRepoDialog from "@/components/dialogs/LinkRepoDialog";
import GithubCommits from "@/components/GithubCommits";
import Modal, { FormRow, ModalActions } from "@/components/Modal";
import { AlertTriangle, Link2 } from "lucide-react";

const statusOrder: TaskStatus[] = ["doing", "todo", "done"];
const statusLabels: Record<TaskStatus, string> = {
  doing: "Now",
  todo: "Next",
  done: "Done",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const decisions = useStore((s) => s.decisions);
  const updateProject = useStore((s) => s.updateProject);
  const setProjectState = useStore((s) => s.setProjectState);
  const addTask = useStore((s) => s.addTask);
  const addDecision = useStore((s) => s.addDecision);
  const setFocusProject = useStore((s) => s.setFocusProject);
  const focusProjectId = useStore((s) => s.focusProjectId);
  const deleteProject = useStore((s) => s.deleteProject);
  const [newTask, setNewTask] = useState("");
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [parkOpen, setParkOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [alsoDeleteTasks, setAlsoDeleteTasks] = useState(false);
  const [linkRepoOpen, setLinkRepoOpen] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const setTaskStatus = useStore((s) => s.setTaskStatus);

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-4 md:p-8">
        <Link to="/projects" className="text-ink-400">
          ← Back to projects
        </Link>
        <div className="mt-8 text-ink-500">Project not found.</div>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectDecisions = decisions
    .filter((d) => d.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const isFocus = focusProjectId === project.id;

  return (
    <div className="relative">
      {/* top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${project.accentColor}, transparent)`,
        }}
      />
      <div
        className="absolute -top-20 left-1/4 w-[500px] h-[300px] opacity-[0.08] blur-3xl rounded-full pointer-events-none"
        style={{ background: project.accentColor }}
      />

      <div className="relative p-8 pb-16 max-w-[1200px]">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-200 font-mono mb-6 transition"
        >
          <ArrowLeft className="w-3 h-3" /> projects
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: project.accentColor }}
              />
              <TypeBadge type={project.type} />
              <span className="text-ink-700">·</span>
              <StateBadge state={project.state} />
              {isFocus && (
                <>
                  <span className="text-ink-700">·</span>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-accent-amber">
                    <Target className="w-3 h-3" /> current focus
                  </span>
                </>
              )}
            </div>
            <h1
              className="text-4xl font-semibold tracking-tight mb-2"
              style={{ color: project.accentColor }}
            >
              {project.name}
            </h1>
            <p className="text-lg text-ink-400 max-w-2xl">{project.oneLiner}</p>
          </div>
          <div className="flex items-center gap-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded-lg text-ink-300 hover:bg-ink-800 transition"
              >
                <ExternalLink className="w-3 h-3" /> live
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded-lg text-ink-300 hover:bg-ink-800 transition"
              >
                <GitBranch className="w-3 h-3" /> repo
              </a>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFocusProject(isFocus ? null : project.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition",
              isFocus
                ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/30"
                : "border border-ink-800 text-ink-300 hover:bg-ink-800"
            )}
          >
            <Target className="w-3 h-3" />
            {isFocus ? "Focused" : "Set as focus"}
          </button>
          <StateActionButtons
            current={project.state}
            onChange={(s) => {
              if (s === "on_hold") {
                setParkOpen(true);
              } else {
                setProjectState(project.id, s);
              }
            }}
          />
          {project.type === "code" && (
            <button
              onClick={() => setLinkRepoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded-lg text-ink-300 hover:bg-ink-800 transition"
            >
              <Link2 className="w-3 h-3" />
              {project.repoUrl ? "Edit repo link" : "Link repo"}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => {
              setAlsoDeleteTasks(false);
              setDeleteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded-lg text-ink-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition"
          >
            <Trash2 className="w-3 h-3" />
            Delete project
          </button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Next action */}
          <section className="col-span-12 lg:col-span-8 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-3 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Next action
            </div>
            {editingNextAction ? (
              <div>
                <textarea
                  autoFocus
                  defaultValue={project.nextAction ?? ""}
                  onBlur={(e) => {
                    updateProject(project.id, { nextAction: e.target.value });
                    setEditingNextAction(false);
                  }}
                  className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm outline-none resize-none h-20"
                />
                <div className="text-[10px] text-ink-600 font-mono mt-1">
                  blurs to save
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingNextAction(true)}
                className="text-left w-full text-xl md:text-2xl text-ink-50 leading-snug hover:text-white transition"
              >
                {project.nextAction ?? (
                  <span className="text-ink-500 italic">
                    Click to set a next action…
                  </span>
                )}
              </button>
            )}
          </section>

          {/* Meta */}
          <section className="col-span-12 lg:col-span-4 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono mb-3">
              Meta
            </div>
            <div className="space-y-2.5 text-sm">
              <MetaRow label="Last touched" value={relativeTime(project.lastTouchedAt)} />
              {project.stack && (
                <MetaRow
                  label="Stack"
                  value={
                    <div className="flex flex-wrap gap-1 justify-end">
                      {project.stack.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono px-1.5 py-0.5 bg-ink-800/80 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  }
                />
              )}
              {project.client && <MetaRow label="Client" value={project.client} />}
              {project.dueDate && <MetaRow label="Due" value={project.dueDate} />}
            </div>
            {project.resumeNote && (
              <div className="mt-4 p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg">
                <div className="text-[10px] uppercase tracking-wider font-mono text-amber-400 mb-1 flex items-center gap-1">
                  <PauseCircle className="w-3 h-3" /> Resume note
                </div>
                <div className="text-sm text-ink-200">{project.resumeNote}</div>
              </div>
            )}
          </section>

          {/* Kanban */}
          <section className="col-span-12 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                Tasks
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTask.trim()) return;
                  addTask({ title: newTask, projectId: project.id });
                  setNewTask("");
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Quick add task…"
                  className="bg-ink-950 border border-ink-800 rounded-lg px-3 py-1.5 text-xs outline-none w-60"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-ink-50 text-ink-950 rounded-lg text-xs font-medium hover:bg-white transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {statusOrder.map((status) => {
                const items = projectTasks.filter((t) => t.status === status);
                const isDropTarget = draggingTaskId !== null;
                const draggingTask = draggingTaskId
                  ? projectTasks.find((t) => t.id === draggingTaskId)
                  : null;
                const isSameColumn = draggingTask?.status === status;
                return (
                  <div
                    key={status}
                    onDragOver={(e) => {
                      if (isDropTarget && !isSameColumn) e.preventDefault();
                    }}
                    onDrop={async () => {
                      if (draggingTaskId && !isSameColumn) {
                        await setTaskStatus(draggingTaskId, status);
                      }
                      setDraggingTaskId(null);
                    }}
                    className={cn(
                      "rounded-xl p-3 transition min-h-[120px]",
                      isDropTarget && !isSameColumn
                        ? "bg-ink-900/80 border border-dashed border-accent-amber/40"
                        : "bg-ink-950/40 border border-ink-800/60"
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-2 flex items-center justify-between px-1">
                      <span>{statusLabels[status]}</span>
                      <span>{items.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {items.map((t) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          hideProject
                          compact
                          draggable
                          onDragStart={() => setDraggingTaskId(t.id)}
                          onDragEnd={() => setDraggingTaskId(null)}
                        />
                      ))}
                      {items.length === 0 && (
                        <div className="text-[11px] text-ink-600 px-3 py-2">
                          {isDropTarget && !isSameColumn ? "drop here" : "empty"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent commits (if repo linked) */}
          <GithubCommits repoUrl={project.repoUrl} />

          {/* Decision log */}
          <section className="col-span-12 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono flex items-center gap-2">
                <Lightbulb className="w-3 h-3" /> Decision log
              </div>
              <button
                onClick={() => setDecisionOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-ink-100 transition"
              >
                <Plus className="w-3 h-3" /> log decision
              </button>
            </div>
            <div className="space-y-3">
              {projectDecisions.length === 0 && (
                <div className="text-sm text-ink-500">
                  No decisions logged yet. Capture them so future-you doesn't re-debate.
                </div>
              )}
              {projectDecisions.map((d) => (
                <div
                  key={d.id}
                  className="border-l-2 border-ink-700 pl-4 py-1"
                  style={{ borderColor: project.accentColor + "60" }}
                >
                  <div className="text-[10px] font-mono text-ink-500 mb-0.5">
                    {d.date}
                  </div>
                  <div className="text-sm text-ink-100 mb-0.5">{d.what}</div>
                  <div className="text-xs text-ink-500">{d.why}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ParkDialog
        open={parkOpen}
        onClose={() => setParkOpen(false)}
        projectId={project.id}
      />
      <DecisionDialog
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        projectId={project.id}
      />
      <LinkRepoDialog
        open={linkRepoOpen}
        onClose={() => setLinkRepoOpen(false)}
        projectId={project.id}
      />
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Delete · ${project.name}`}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm text-ink-300 leading-relaxed flex-1">
            This will permanently delete{" "}
            <span className="text-ink-100 font-medium">{project.name}</span> and
            its {projectDecisions.length} logged{" "}
            {projectDecisions.length === 1 ? "decision" : "decisions"}. Linked
            tasks and time blocks will be kept (unchecked) but unlinked from
            this project.
          </div>
        </div>
        {projectTasks.length > 0 && (
          <FormRow label="Tasks linked to this project">
            <label className="flex items-start gap-2 p-3 bg-ink-950/60 border border-ink-800 rounded-lg cursor-pointer hover:border-ink-700 transition">
              <input
                type="checkbox"
                checked={alsoDeleteTasks}
                onChange={(e) => setAlsoDeleteTasks(e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm text-ink-100">
                  Also delete {projectTasks.length}{" "}
                  {projectTasks.length === 1 ? "task" : "tasks"}
                </div>
                <div className="text-xs text-ink-500 mt-0.5">
                  Off = tasks become standalone (move to inbox).
                </div>
              </div>
            </label>
          </FormRow>
        )}
        <ModalActions>
          <button
            onClick={() => setDeleteOpen(false)}
            className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await deleteProject(project.id, { deleteTasks: alsoDeleteTasks });
              setDeleteOpen(false);
              navigate("/projects");
            }}
            className="px-3 py-1.5 text-sm bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-400 transition"
          >
            Delete project
          </button>
        </ModalActions>
      </Modal>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] uppercase tracking-wider font-mono text-ink-500">
        {label}
      </span>
      <span className="text-ink-200 text-right">{value}</span>
    </div>
  );
}

function StateActionButtons({
  current,
  onChange,
}: {
  current: ProjectState;
  onChange: (s: ProjectState) => void;
}) {
  const options: { state: ProjectState; label: string; icon: any }[] = [
    { state: "active", label: "Resume", icon: Play },
    { state: "on_hold", label: "Park", icon: Pause },
    { state: "waiting", label: "Waitlist", icon: Clock },
    { state: "shipped", label: "Ship it", icon: Archive },
  ];
  return (
    <>
      {options
        .filter((o) => o.state !== current)
        .map((o) => (
          <button
            key={o.state}
            onClick={() => onChange(o.state)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-800 rounded-lg text-ink-300 hover:bg-ink-800 transition"
          >
            <o.icon className="w-3 h-3" />
            {o.label}
          </button>
        ))}
    </>
  );
}
