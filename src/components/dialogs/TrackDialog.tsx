import { useEffect, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useLearningStore } from "@/lib/learningStore";
import type { LearningTrack, TrackAccent } from "@/lib/types";
import { ACCENT, ACCENT_OPTIONS } from "@/lib/learningAccent";
import { cn, isoDate } from "@/lib/utils";

// Create (no `track`) or edit (with `track`) a learning track.
export default function TrackDialog({
  open,
  onClose,
  track,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  track?: LearningTrack;
  onCreated?: (id: string) => void;
}) {
  const addTrack = useLearningStore((s) => s.addTrack);
  const updateTrack = useLearningStore((s) => s.updateTrack);
  const isEdit = !!track;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState<TrackAccent>("amber");
  const [targetFinishOn, setTargetFinishOn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(track?.name ?? "");
      setDescription(track?.description ?? "");
      setAccent(track?.colorAccent ?? "amber");
      setTargetFinishOn(track?.targetFinishOn ?? "");
      setSaving(false);
    }
  }, [open, track]);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateTrack(track!.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          colorAccent: accent,
          targetFinishOn: targetFinishOn || undefined,
        });
        onClose();
      } else {
        const id = await addTrack({
          name: name.trim(),
          description: description.trim() || undefined,
          colorAccent: accent,
          startedOn: isoDate(new Date()),
          targetFinishOn: targetFinishOn || undefined,
          archived: false,
        });
        onClose();
        onCreated?.(id);
      }
    } catch (e) {
      setSaving(false);
      alert("Couldn't save the track. Is the learning migration applied?");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit track" : "New learning track"}
      width={500}
    >
      <FormRow label="Name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Finance & Macro, Linear Algebra, Spanish…"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you building toward?"
          rows={2}
          className={cn(inputCls(), "resize-none")}
        />
      </FormRow>
      <FormRow label="Accent color">
        <div className="flex gap-2 flex-wrap">
          {ACCENT_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAccent(c)}
              title={c}
              className={cn(
                "w-7 h-7 rounded-lg border-2 transition",
                ACCENT[c].bg,
                accent === c
                  ? "border-ink-100 scale-110"
                  : "border-transparent hover:scale-105"
              )}
            />
          ))}
        </div>
      </FormRow>
      <FormRow label="Target finish (optional)">
        <input
          type="date"
          value={targetFinishOn}
          onChange={(e) => setTargetFinishOn(e.target.value)}
          className={cn(inputCls(), "[color-scheme:dark]")}
        />
      </FormRow>
      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!name.trim() || saving}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create track"}
        </button>
      </ModalActions>
    </Modal>
  );
}
