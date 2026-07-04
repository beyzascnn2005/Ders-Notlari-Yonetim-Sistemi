"use client";

import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[90]"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl shadow-lg w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`shrink-0 rounded-full p-2 ${
              danger ? "bg-danger/10" : "bg-primary/10"
            }`}
          >
            <AlertTriangle
              size={20}
              className={danger ? "text-danger" : "text-primary"}
            />
          </div>
          <div>
            <h2 className="font-display font-bold text-base">{title}</h2>
            <p className="text-sm text-muted mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-black/5 transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${
              danger
                ? "bg-danger hover:bg-danger-hover"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
