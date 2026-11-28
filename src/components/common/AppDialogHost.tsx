import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AlertVariant = "info" | "success" | "error";
export type ConfirmVariant = "default" | "danger";

export interface AlertOptions {
  title?: string;
  message: string;
  variant?: AlertVariant;
  confirmLabel?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

type DialogRequest =
  | {
      kind: "alert";
      title: string;
      message: string;
      variant: AlertVariant;
      confirmLabel: string;
      resolve: () => void;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      variant: ConfirmVariant;
      confirmLabel: string;
      cancelLabel: string;
      resolve: (confirmed: boolean) => void;
    };

type Listener = (request: DialogRequest) => void;

const listeners = new Set<Listener>();
const pendingQueue: DialogRequest[] = [];

function enqueue(request: DialogRequest) {
  if (listeners.size === 0) {
    pendingQueue.push(request);
    return;
  }
  listeners.forEach((listener) => listener(request));
}

/**
 * Show an application modal alert instead of window.alert.
 */
export function showAlert(options: string | AlertOptions): Promise<void> {
  const normalized: AlertOptions =
    typeof options === "string" ? { message: options } : options;
  const variant: AlertVariant = normalized.variant ?? "info";
  const defaultTitle =
    variant === "error"
      ? "Something went wrong"
      : variant === "success"
        ? "Success"
        : "Notice";

  return new Promise<void>((resolve) => {
    enqueue({
      kind: "alert",
      title: normalized.title ?? defaultTitle,
      message: normalized.message,
      variant,
      confirmLabel: normalized.confirmLabel ?? "OK",
      resolve,
    });
  });
}

/**
 * Show an application modal confirmation dialog instead of window.confirm.
 */
export function showConfirm(options: string | ConfirmOptions): Promise<boolean> {
  const normalized: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;

  return new Promise<boolean>((resolve) => {
    enqueue({
      kind: "confirm",
      title: normalized.title ?? "Confirm Action",
      message: normalized.message,
      variant: normalized.variant ?? "default",
      confirmLabel: normalized.confirmLabel ?? "Confirm",
      cancelLabel: normalized.cancelLabel ?? "Cancel",
      resolve,
    });
  });
}

export default function AppDialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>(() => {
    const initial = [...pendingQueue];
    pendingQueue.length = 0;
    return initial;
  });

  useEffect(() => {
    const onRequest: Listener = (request) => {
      setQueue((prev) => [...prev, request]);
    };
    listeners.add(onRequest);
    if (pendingQueue.length > 0) {
      const drained = pendingQueue.splice(0, pendingQueue.length);
      setQueue((prev) => [...prev, ...drained]);
    }
    return () => {
      listeners.delete(onRequest);
    };
  }, []);

  const current = queue[0] ?? null;

  const closeCurrent = (confirmed: boolean) => {
    if (!current) return;
    if (current.kind === "alert") {
      current.resolve();
    } else {
      current.resolve(confirmed);
    }
    setQueue((prev) => prev.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCurrent(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!current) return null;

  const isDanger =
    (current.kind === "alert" && current.variant === "error") ||
    (current.kind === "confirm" && current.variant === "danger");
  const isSuccess = current.kind === "alert" && current.variant === "success";

  const iconWrapClass = isDanger
    ? "bg-rose-50 text-rose-600"
    : isSuccess
      ? "bg-emerald-50 text-emerald-600"
      : "bg-indigo-50 text-indigo-600";

  const confirmBtnClass = isDanger
    ? "bg-rose-600 hover:bg-rose-700"
    : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-dialog-title"
      onClick={() => closeCurrent(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}
            >
              {isDanger ? (
                current.kind === "confirm" ? (
                  <AlertTriangle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )
              ) : isSuccess ? (
                <CheckCircle2 size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>
            <div>
              <h3
                id="app-dialog-title"
                className="text-base font-bold text-slate-900"
              >
                {current.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {current.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => closeCurrent(false)}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          {current.kind === "confirm" && (
            <button
              type="button"
              onClick={() => closeCurrent(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {current.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => closeCurrent(true)}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition ${confirmBtnClass}`}
          >
            {current.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
