import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  Waves,
} from "lucide-react";
import { useStore } from "../store/Store";
import { activeBatchForPond, batchAge, daysToHarvest } from "../lib/calc";
import { formatDate, number } from "../lib/format";
import { PondIllustration, StatusBadge } from "./UI";

export default function PondCard({ pond }) {
  const { state } = useStore();
  const current = activeBatchForPond(state, pond.id);
  const last = state.batches
    .filter((batch) => batch.pondId === pond.id && batch.status === "selesai")
    .sort((a, b) => b.tanggalSelesai.localeCompare(a.tanggalSelesai))[0];
  const age = current ? batchAge(current.tanggalTebar) : 0;
  const remaining = current ? daysToHarvest(current.tanggalTebar) : 0;
  return (
    <article
      className={`pond-card ${current ? "pond-active" : last ? "pond-completed" : "pond-empty"}`}
    >
      <div className="pond-card-top">
        <span className="pond-symbol">
          <Waves size={18} />
        </span>
        <h3>{pond.nama}</h3>
        <StatusBadge
          status={current?.status || (last ? "selesai" : "kosong")}
        />
      </div>
      <div className="pond-art">
        <PondIllustration empty={!current} />
        <span className="pond-code">
          {current
            ? current.kode
            : last
              ? `${last.kode} · batch terakhir`
              : "SIAP UNTUK CERITA BARU"}
        </span>
      </div>
      {current ? (
        <>
          <div className="pond-metrics">
            <div>
              <span>Bibit awal</span>
              <strong>
                {number(current.jumlahBibit)} <small>ekor</small>
              </strong>
            </div>
            <div>
              <span>Umur batch</span>
              <strong>
                {age} <small>hari</small>
              </strong>
            </div>
          </div>
          <div className="pond-progress-label">
            <span>Siklus budidaya</span>
            <strong>{Math.min(Math.round((age / 90) * 100), 100)}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`Siklus budidaya ${pond.nama}`}
            aria-valuenow={Math.min(age, 90)}
            aria-valuemin={0}
            aria-valuemax={90}
          >
            <span style={{ width: `${Math.min((age / 90) * 100, 100)}%` }} />
          </div>
          <div className="pond-card-bottom">
            <span>
              <CalendarDays size={14} />
              {remaining > 0
                ? `${remaining} hari menuju panen`
                : remaining === 0
                  ? "Perkiraan panen hari ini"
                  : `${Math.abs(remaining)} hari lewat estimasi`}
            </span>
            <Link
              className="round-link"
              to={`/batches/${current.id}`}
              aria-label={`Lihat detail ${pond.nama}`}
            >
              <ArrowRight size={18} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="pond-idle-copy">
            {last ? (
              <>
                <span className="idle-label">
                  <CheckCircle2 size={16} /> Siklus budidaya selesai
                </span>
                <p>
                  Ditutup {formatDate(last.tanggalSelesai)}. Kolam siap
                  digunakan kembali.
                </p>
              </>
            ) : (
              <>
                <span className="idle-label">Ruang untuk tumbuh lagi</span>
                <p>
                  Kolam masih kosong. Mulai batch baru dan catat perjalanan
                  budidaya Anda.
                </p>
              </>
            )}
          </div>
          <div className="pond-idle-actions">
            <Link
              className="btn btn-secondary"
              to={`/batches/new?pond=${pond.id}`}
            >
              <Plus size={16} /> Mulai Batch
            </Link>
            {last && (
              <Link className="text-button" to={`/batches/${last.id}`}>
                Lihat hasil <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </>
      )}
    </article>
  );
}
