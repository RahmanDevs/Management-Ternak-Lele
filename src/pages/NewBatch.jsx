import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Fish,
  Sprout,
  Waves,
} from "lucide-react";
import { useStore } from "../store/Store";
import { activeBatchForPond, expectedHarvest } from "../lib/calc";
import { formatDate, todayJakarta } from "../lib/format";
import {
  ErrorBox,
  Field,
  PageHeader,
  PondIllustration,
  TipCard,
} from "../components/UI";

export default function NewBatch() {
  const { state, transact, notify } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [pondId, setPondId] = useState(
    params.get("pond") ||
      state.ponds.find((pond) => !activeBatchForPond(state, pond.id))?.id ||
      state.ponds[0].id,
  );
  const [date, setDate] = useState(todayJakarta());
  const [error, setError] = useState("");
  const occupied = activeBatchForPond(state, pondId);
  const estimate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
      ? expectedHarvest(date)
      : null;
  function submit(event) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const id = transact("NEW_BATCH", {
        ...data,
        pondId,
        tanggalTebar: date,
        biayaLain: data.biayaLain || 0,
      });
      notify("Batch baru berhasil dimulai. Selamat bertumbuh!");
      navigate(`/batches/${id}`);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="page-enter">
      <PageHeader
        back="/batches"
        eyebrow="LANGKAH PERTAMA, HASIL BERIKUTNYA"
        title="Mulai batch baru"
        description="Siapkan kolam, catat bibit, dan mulai perjalanan budidaya Anda."
      />
      <div className="form-layout">
        <form className="panel form-panel" onSubmit={submit}>
          <ErrorBox message={error} />
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Pilih rumah untuk bibit Anda</h2>
              <p>Satu kolam hanya untuk satu batch berjalan.</p>
            </div>
          </div>
          <fieldset className="pond-picker">
            <legend className="sr-only">Pilih kolam</legend>
            {state.ponds.map((pond) => {
              const filled = activeBatchForPond(state, pond.id);
              return (
                <label
                  key={pond.id}
                  className={`pond-option ${pondId === pond.id ? "selected" : ""} ${filled ? "occupied" : ""}`}
                >
                  <input
                    type="radio"
                    name="pondChoice"
                    value={pond.id}
                    checked={pondId === pond.id}
                    onChange={() => setPondId(pond.id)}
                  />
                  <Waves size={23} />
                  <strong>{pond.nama}</strong>
                  <span>{filled ? "Terisi" : "Tersedia"}</span>
                  {pondId === pond.id && (
                    <Check className="pond-option-check" size={14} />
                  )}
                </label>
              );
            })}
          </fieldset>
          {occupied && (
            <div className="notice notice-warning">
              Kolam ini masih terisi batch {occupied.kode}. Batch baru akan
              ditolak hingga batch sebelumnya selesai.
            </div>
          )}
          <div className="form-section-heading form-divider">
            <span>02</span>
            <div>
              <h2>Detail penebaran bibit</h2>
              <p>Awali dengan catatan yang tepat.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Pemasok bibit">
              <select name="supplierId" defaultValue="" required>
                <option value="" disabled>
                  Pilih pemasok
                </option>
                {state.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nama}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal tebar">
              <input
                name="tanggalTebar"
                type="date"
                value={date}
                max={todayJakarta()}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Jumlah bibit (ekor)">
              <input
                name="jumlahBibit"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="Contoh: 5000"
                required
              />
            </Field>
            <Field
              label="Total biaya bibit (Rp)"
              hint="Total pembelian bibit, bukan harga per ekor."
            >
              <input
                name="hargaBibitTotal"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="Contoh: 1500000"
                required
              />
            </Field>
            <Field
              label="Biaya lain (Rp)"
              optional
              hint="Misalnya persiapan kolam atau transportasi."
            >
              <input
                name="biayaLain"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
              />
            </Field>
          </div>
          <div className="harvest-estimate">
            <CalendarDays size={23} />
            <div>
              <span>Perkiraan tanggal panen</span>
              <strong>{formatDate(estimate)}</strong>
            </div>
            <span>90 hari setelah tebar</span>
          </div>
          <div className="form-actions">
            <Link className="btn btn-secondary" to="/batches">
              Batal
            </Link>
            <button className="btn btn-primary" type="submit">
              <Sprout size={18} /> Mulai Batch <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="batch-preview">
            <span className="eyebrow">AWAL YANG BAIK</span>
            <PondIllustration empty />
            <h3>{state.ponds.find((pond) => pond.id === pondId)?.nama}</h3>
            <p>
              Bibit hari ini,
              <br />
              harapan untuk esok hari.
            </p>
          </div>
          <TipCard title="Catatan rapi, budidaya terkendali">
            Tanggal panen adalah estimasi. Anda tetap dapat memanen lebih awal,
            lebih lambat, atau secara bertahap sesuai kondisi ikan.
          </TipCard>
          <div className="small-note">
            <Fish size={18} />
            <span>
              Data dapat dilanjutkan kapan saja selama tersimpan di browser yang
              sama.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
