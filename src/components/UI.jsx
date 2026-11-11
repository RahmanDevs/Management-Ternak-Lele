import { cloneElement, useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Fish,
  Sprout,
  Waves,
  X,
} from "lucide-react";
import { useStore } from "../store/Store";

export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Leleku, beranda"
    >
      <span className="brand-mark">
        <Fish size={27} strokeWidth={1.8} />
      </span>
      <span>
        leleku<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function OwnerOnly({ children }) {
  return useStore().user?.role === "owner" ? children : null;
}

export function StatusBadge({ status }) {
  const labels = {
    aktif: "Aktif",
    panen: "Panen",
    selesai: "Selesai",
    kosong: "Tersedia",
    lunas: "Lunas",
    belum: "Belum Lunas",
  };
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {labels[status] || status}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, action, back }) {
  return (
    <header className="page-heading">
      <div>
        {back && (
          <Link className="back-link" to={back}>
            <ArrowLeft size={16} /> Kembali
          </Link>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  description,
  icon: Icon = Fish,
  tone = "green",
  children,
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      {children || <p className="stat-description">{description}</p>}
    </article>
  );
}

export function Field({ label, hint, children, optional = false }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="optional"> · opsional</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function ErrorBox({ message }) {
  const ref = useRef(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  if (!message) return null;
  return (
    <div ref={ref} tabIndex={-1} className="error-box" role="alert">
      <AlertCircle size={19} />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title = "Belum ada catatan",
  description = "Catatan yang ditambahkan akan tampil di sini.",
  action,
  icon: Icon = Sprout,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ConfirmDialog({
  title,
  children,
  onConfirm,
  onClose,
  confirmLabel = "Ya, lanjutkan",
  danger = false,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const bodyId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <span className={`dialog-icon ${danger ? "danger" : ""}`}>
          <AlertCircle size={25} />
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Tutup dialog"
        >
          <X size={20} />
        </button>
      </div>
      <h2 id={titleId}>{title}</h2>
      <div id={bodyId} className="dialog-body">
        {children}
      </div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" autoFocus onClick={onClose}>
          Batal
        </button>
        <button
          className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Toast() {
  const { toast, dismissToast } = useStore();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast">
          <span className="toast-check">
            <Check size={18} />
          </span>
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Tutup pemberitahuan"
            onClick={dismissToast}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export function PondIllustration({ empty = false, large = false }) {
  const uid = useId().replaceAll(":", "");
  return (
    <svg
      className={`pond-illustration ${large ? "pond-large" : ""}`}
      viewBox="0 0 360 170"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${uid}-wall`}
          x1="55"
          y1="90"
          x2="300"
          y2="165"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={empty ? "#dce3d6" : "#90aaa0"} />
          <stop offset="1" stopColor={empty ? "#bbcbbc" : "#537d70"} />
        </linearGradient>
        <linearGradient
          id={`${uid}-water`}
          x1="130"
          y1="15"
          x2="230"
          y2="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={empty ? "#e3eadd" : "#9ccbc0"} />
          <stop offset="1" stopColor={empty ? "#cad7c7" : "#519b8d"} />
        </linearGradient>
      </defs>
      <ellipse
        cx="183"
        cy="151"
        rx="127"
        ry="13"
        fill="#183f32"
        opacity=".07"
      />
      <path
        d="M47 65V111C47 140 107 159 181 159S315 140 315 111V65H47Z"
        fill={`url(#${uid}-wall)`}
      />
      {[77, 145, 217, 285].map((x) => (
        <path
          key={x}
          d={`M${x} 83v62`}
          stroke={empty ? "#acbead" : "#315d4f"}
          strokeOpacity=".22"
          strokeWidth="3"
        />
      ))}
      <ellipse
        cx="181"
        cy="65"
        rx="138"
        ry="52"
        fill={empty ? "#b6c9b7" : "#345f51"}
      />
      <ellipse cx="181" cy="64" rx="127" ry="43" fill={`url(#${uid}-water)`} />
      <ellipse
        cx="181"
        cy="64"
        rx="122"
        ry="39"
        stroke="white"
        strokeOpacity=".35"
      />
      <path
        d="M80 62c24-9 46-9 65-4M190 37c25-1 41 3 59 9M221 82c17 0 32-3 40-7"
        stroke="white"
        strokeOpacity=".55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {!empty && (
        <g fill="#245e51" opacity=".7">
          <path
            d="M118 67q15-12 31 0-14 13-31 0l-9 5V61l9 6Z"
            transform="rotate(-15 128 67)"
          />
          <path
            d="M209 59q18-12 35 0-17 12-35 0l-10 6V53l10 6Z"
            transform="rotate(15 225 59)"
          />
          <path
            d="M168 87q13-10 27 0-14 10-27 0l-8 5V82l8 5Z"
            transform="rotate(-8 181 87)"
          />
        </g>
      )}
      <path
        d="M286 33V14h24v14"
        stroke={empty ? "#9ab29b" : "#517866"}
        strokeWidth="7"
        strokeLinecap="round"
      />
      {!empty && (
        <path
          d="M310 31v18"
          stroke="#e7f4e9"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="3 5"
        />
      )}
    </svg>
  );
}

export function TipCard({ title, children }) {
  return (
    <aside className="tip-card">
      <div className="tip-icon">
        <Waves size={23} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      <span className="tip-footer">
        Tumbuh lebih baik, setiap hari <ArrowUpRight size={16} />
      </span>
    </aside>
  );
}
