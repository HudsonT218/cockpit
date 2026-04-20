import Modal, { ModalActions } from "../Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 mb-4">
        {danger && (
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
        )}
        <div className="text-sm text-ink-300 leading-relaxed flex-1">
          {message}
        </div>
      </div>
      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={
            danger
              ? "px-3 py-1.5 text-sm bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-400 transition"
              : "px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition"
          }
        >
          {confirmLabel}
        </button>
      </ModalActions>
    </Modal>
  );
}
