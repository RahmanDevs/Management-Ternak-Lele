import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Leaf,
  ShieldCheck,
  Sprout,
  Users,
  Waves,
} from "lucide-react";
import { useStore } from "../store/Store";
import { Brand, ErrorBox, Field, PondIllustration } from "../components/UI";

export default function Login() {
  const { user, login } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  if (user)
    return (
      <Navigate to={user.role === "owner" ? "/dashboard" : "/worker"} replace />
    );
  function enter(username, password) {
    try {
      const role = login(username, password);
      navigate(role === "owner" ? "/dashboard" : "/worker", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    enter(values.get("username"), values.get("password"));
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand light />
        <div className="story-content">
          <span className="story-tag">
            <Leaf size={15} /> PARTNER BUDIDAYA ANDA
          </span>
          <h1>
            Kolam terawat.
            <br />
            Usaha <span>bertumbuh.</span>
          </h1>
          <p>
            Catat setiap langkah budidaya, dari tebar bibit sampai panen. Lebih
            tertata, lebih bermakna.
          </p>
          <div className="login-pond-scene">
            <div className="scene-ring ring-one" />
            <div className="scene-ring ring-two" />
            <PondIllustration large />
            <span className="scene-label scene-label-one">
              <span className="scene-icon">
                <Sprout size={20} />
              </span>
              <span>
                <strong>Setiap bibit berarti</strong>
                <small>Pantau dari hari pertama</small>
              </span>
            </span>
            <span className="scene-label scene-label-two">
              <span className="scene-check">
                <Check size={15} />
              </span>{" "}
              Siap tumbuh bersama
            </span>
          </div>
        </div>
        <div className="story-bottom">
          <Waves size={20} />
          <span>Dibuat untuk peternak. Tumbuh bersama peternak.</span>
        </div>
      </section>
      <section className="login-form-section">
        <div className="login-top">
          <div className="login-mobile-brand">
            <Brand />
          </div>
          <span className="demo-badge">
            <span /> Mode Demo
          </span>
        </div>
        <div className="login-form-wrap">
          <span className="login-welcome-icon">
            <Sprout size={26} />
          </span>
          <p className="eyebrow">SELAMAT DATANG DI LELEKU</p>
          <h2>Mulai hari yang produktif.</h2>
          <p className="login-subtitle">
            Masuk dan lihat kabar baik dari kolam Anda.
          </p>
          <ErrorBox message={error} />
          <form onSubmit={submit} className="form-stack">
            <Field label="Username">
              <input
                name="username"
                autoComplete="username"
                placeholder="Masukkan username"
                required
              />
            </Field>
            <div className="password-field">
              <Field label="Password">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  required
                />
              </Field>
              <button
                type="button"
                className="password-toggle icon-button"
                aria-label={
                  visible ? "Sembunyikan password" : "Tampilkan password"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <button className="btn btn-primary login-submit" type="submit">
              Masuk ke Leleku <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-divider">
            <span>atau jelajahi demo langsung</span>
          </div>
          <div className="demo-logins">
            <button onClick={() => enter("owner", "owner123")}>
              <span className="demo-role-icon">
                <ShieldCheck size={22} />
              </span>
              <span>
                <strong>Masuk sebagai Owner</strong>
                <small>Kelola farm & lihat hasil usaha</small>
              </span>
              <ArrowRight size={18} />
            </button>
            <button onClick={() => enter("worker", "worker123")}>
              <span className="demo-role-icon worker">
                <Users size={22} />
              </span>
              <span>
                <strong>Masuk sebagai Farm Worker</strong>
                <small>Catat pakan & aktivitas harian</small>
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
          <details className="demo-credentials">
            <summary>Lihat akun demo</summary>
            <p>
              Owner: <code>owner / owner123</code>
              <br />
              Worker: <code>worker / worker123</code>
            </p>
          </details>
          <p className="login-disclaimer">
            <ShieldCheck size={16} /> Demo tersimpan di browser ini. Bukan untuk
            data produksi.
          </p>
        </div>
        <p className="login-copyright">
          © {new Date().getFullYear()} Leleku. Budidaya lebih tertata.
        </p>
      </section>
    </main>
  );
}
