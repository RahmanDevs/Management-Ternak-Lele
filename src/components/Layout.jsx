import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Fish,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Wheat,
} from "lucide-react";
import { useStore } from "../store/Store";
import { longDate } from "../lib/format";
import { Brand, ConfirmDialog, OwnerOnly, Toast } from "./UI";

export default function Layout() {
  const { user, state, logout, transact, notify, storageWarning } = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const owner = user.role === "owner";
  const home = owner ? "/dashboard" : "/worker";
  const links = owner
    ? [
        { to: home, label: "Dashboard", icon: LayoutDashboard },
        { to: "/batches", label: "Daftar Batch", icon: Fish },
        { to: "/feed", label: "Catat Pakan", icon: Wheat },
        { to: "/mortality", label: "Catat Kematian", icon: ClipboardList },
        { to: "/history", label: "Riwayat Harian", icon: History },
      ]
    : [
        { to: home, label: "Beranda", icon: LayoutDashboard },
        { to: "/feed", label: "Pakan", icon: Wheat },
        { to: "/mortality", label: "Kematian", icon: ClipboardList },
        { to: "/history", label: "Riwayat", icon: History },
      ];
  const activeLabel =
    links.find((link) => pathname.startsWith(link.to))?.label || "Mulai Batch";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = `${activeLabel} · Leleku`;
  }, [pathname, activeLabel]);
  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }
  function reset() {
    transact("RESET");
    setResetOpen(false);
    notify("Data demo berhasil dikembalikan ke kondisi awal.");
    navigate(home);
  }
  return (
    <div className={`app-shell ${owner ? "owner-shell" : "worker-shell"}`}>
      <a className="skip-link" href="#main-content">
        Lewati navigasi
      </a>
      <aside className="sidebar">
        <Brand light />
        <div className="farm-switch">
          <span className="farm-symbol">
            <Leaf size={22} />
          </span>
          <div>
            <strong>{state.farm.nama}</strong>
            <span>Budidaya lele</span>
          </div>
          <MapPin size={16} />
        </div>
        <p className="nav-caption">RUANG KERJA</p>
        <nav className="side-nav" aria-label="Navigasi utama">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{label}</span>
              {to === "/batches" && (
                <span className="nav-count">{state.batches.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <OwnerOnly>
          <Link to="/batches/new" className="sidebar-new">
            <Plus size={18} /> Mulai batch baru
          </Link>
        </OwnerOnly>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <SproutDecoration />
            <h3>
              Dari kolam,
              <br />
              untuk masa depan.
            </h3>
            <p>
              Catatan kecil hari ini,
              <br />
              hasil lebih baik esok hari.
            </p>
          </div>
          <OwnerOnly>
            <button className="reset-button" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} /> Reset Data Demo
            </button>
          </OwnerOnly>
          <div className="sidebar-profile">
            <span className="avatar">{owner ? "PF" : "FW"}</span>
            <div>
              <strong>{user.nama}</strong>
              <span>{owner ? "Owner" : "Farm Worker"}</span>
            </div>
            <button
              aria-label="Keluar"
              className="icon-button"
              onClick={signOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="desktop-breadcrumb">
            <span>Ruang kerja</span>
            <span>/</span>
            <strong>{activeLabel}</strong>
          </div>
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="topbar-right">
            <span className="demo-badge">
              <span /> Mode Demo
            </span>
            <span className="topbar-date">
              <CalendarDays size={16} />
              {longDate()}
            </span>
            <span className="topbar-divider" />
            <span className="header-avatar avatar">{owner ? "PF" : "FW"}</span>
            <button
              className="mobile-logout icon-button"
              onClick={signOut}
              aria-label="Keluar"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {storageWarning && (
            <div role="alert" className="notice notice-warning">
              {storageWarning}
            </div>
          )}
          <Outlet />
          <footer className="page-footer">
            <span>
              <Leaf size={14} /> Leleku · Budidaya lebih tertata.
            </span>
            <span>
              <ShieldCheck size={14} /> Demo lokal, bukan untuk data produksi
            </span>
          </footer>
          <OwnerOnly>
            <button
              className="mobile-reset text-button"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw size={15} /> Reset Data Demo
            </button>
          </OwnerOnly>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navigasi ponsel">
        {(owner
          ? [
              links[0],
              links[1],
              { to: "/batches/new", label: "Mulai Batch", icon: Plus },
              { to: "/feed", label: "Catatan", icon: ClipboardList },
            ]
          : links
        ).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/batches"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast />
      {resetOpen && (
        <ConfirmDialog
          title="Reset seluruh data demo?"
          danger
          confirmLabel="Ya, reset data"
          onClose={() => setResetOpen(false)}
          onConfirm={reset}
        >
          <p>
            Semua batch dan catatan yang Anda tambahkan akan dihapus dari demo
            ini. Kolam A, B, dan C kembali ke data awal. Tindakan ini tidak
            dapat dibatalkan.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function SproutDecoration() {
  return (
    <div className="sprout-decoration" aria-hidden="true">
      <Leaf size={31} strokeWidth={1.2} />
      <ArrowUpRight size={17} />
    </div>
  );
}
