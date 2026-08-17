import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Inbox, Plus, Trash2, X } from "lucide-react";
import { useApp } from "./store";

export function Badge({ status }: { status: string }) {
  return <span className={"badge " + status.toLowerCase().replaceAll(" ", "-")}>{status}</span>;
}

export function Spinner() {
  return <span className="spinner" />;
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Inbox size={22} />}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && onAction && (
        <button className="primary" onClick={onAction}>
          <Plus size={15} /> {action}
        </button>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton-line" style={{ width: `${18 + ((i * 7 + j * 13) % 55)}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={"modal" + (size ? " " + size : "")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button className="head-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  text,
  detail,
  busy,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  detail?: ReactNode;
  busy?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel} footer={<>
      <button className="secondary" disabled={busy} onClick={onCancel}>
        Cancel
      </button>
      <button className="primary danger" disabled={busy} onClick={onConfirm}>
        {busy ? <Spinner /> : <Trash2 size={15} />} {confirmLabel}
      </button>
    </>}>
      <p className="confirm-text">{text}</p>
      {detail && <div className="confirm-detail">{detail}</div>}
    </Modal>
  );
}

export function ToastStack() {
  const { toasts } = useApp();
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={"toast" + (t.type === "error" ? " error" : "")}>
          {t.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
