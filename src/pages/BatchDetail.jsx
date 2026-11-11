import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Fish,
  LayoutDashboard,
  LockKeyhole,
  Scale,
  ShoppingBag,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useStore } from "../store/Store";
import {
  batchAge,
  batchLogs,
  batchSummary,
  expectedHarvest,
} from "../lib/calc";
import { closureWarnings } from "../lib/validate";
import { formatDate, number, rupiah } from "../lib/format";
import {
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Field,
  OwnerOnly,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "../components/UI";
import RecordForm from "../components/RecordForm";

const tabs = [
  ["summary", "Ringkasan", LayoutDashboard],
  ["feed", "Pakan", Wheat],
  ["mortality", "Kematian", ClipboardList],
  ["harvest", "Panen", Scale],
  ["sale", "Penjualan", ShoppingBag],
];

export default function BatchDetail() {
  const { batchId, tab = "summary" } = useParams();
  const { state, transact, notify } = useStore();
  const [closeOpen, setCloseOpen] = useState(false);
  const [error, setError] = useState("");
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch)
    return (
      <EmptyState
        title="Batch tidak ditemukan"
        description="Batch mungkin telah dihapus saat reset data demo."
        action={
          <Link className="btn btn-primary" to="/batches">
            Kembali ke daftar batch
          </Link>
        }
      />
    );
  if (!tabs.some(([key]) => key === tab))
    return <Navigate to={`/batches/${batchId}`} replace />;
  const pond = state.ponds.find((item) => item.id === batch.pondId);
  const closed = batch.status === "selesai";
  const warnings = closureWarnings(state, batch);
  function closeBatch() {
    try {
      transact("CLOSE_BATCH", { batchId, confirmed: true });
      setCloseOpen(false);
      notify("Batch selesai. Kolam tersedia untuk batch berikutnya.");
    } catch (err) {
      setCloseOpen(false);
      setError(err.message);
    }
  }
  return (
    <div className="page-enter">
      <PageHeader
        back="/batches"
        eyebrow={`${state.farm.nama.toUpperCase()} / ${pond.nama.toUpperCase()}`}
        title={
          <>
            {batch.kode} <StatusBadge status={batch.status} />
          </>
        }
        description={`${pond.nama} · Bibit dari ${state.suppliers.find((item) => item.id === batch.supplierId)?.nama}`}
        action={
          !closed && (
            <button
              className="btn btn-secondary"
              onClick={() => setCloseOpen(true)}
            >
              <CheckCircle2 size={18} /> Tutup Batch
            </button>
          )
        }
      />
      <ErrorBox message={error} />
      <div className="batch-facts">
        <span>
          <CalendarDays size={17} /> Tebar{" "}
          <strong>{formatDate(batch.tanggalTebar)}</strong>
        </span>
        <span>
          <Fish size={17} />
          <strong>{number(batch.jumlahBibit)} ekor</strong> bibit awal
        </span>
        <span>
          <Wheat size={17} />
          <strong>
            {batchAge(batch.tanggalTebar, batch.tanggalSelesai || undefined)}{" "}
            hari
          </strong>{" "}
          {closed ? "lama siklus" : "umur batch"}
        </span>
        <span>
          <CalendarDays size={17} /> Estimasi panen{" "}
          <strong>{formatDate(expectedHarvest(batch.tanggalTebar))}</strong>
        </span>
      </div>
      {closed && (
        <div className="notice notice-info">
          <LockKeyhole size={18} />
          <span>
            Batch ditutup pada {formatDate(batch.tanggalSelesai)}. Catatan
            bersifat baca-saja; penjualan belum lunas tetap dapat ditandai
            lunas.
          </span>
        </div>
      )}
      <nav className="detail-tabs" aria-label="Bagian detail batch">
        {tabs.map(([key, label, Icon]) => (
          <Link
            key={key}
            to={`/batches/${batchId}/${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={tab === key ? "active" : ""}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <OwnerOnly>
        {tab === "summary" ? (
          <BatchSummary batch={batch} />
        ) : (
          <div
            className={`record-layout ${closed ? "record-layout-closed" : ""}`}
          >
            {!closed && (
              <RecordForm
                key={`${batchId}-${tab}`}
                kind={tab}
                fixedBatch={batch}
              />
            )}
            <RecordHistory
              key={`${batchId}-${tab}-history`}
              kind={tab}
              batch={batch}
            />
          </div>
        )}
      </OwnerOnly>
      {closeOpen && (
        <ConfirmDialog
          title={`Selesaikan batch ${batch.kode}?`}
          onClose={() => setCloseOpen(false)}
          onConfirm={closeBatch}
          confirmLabel="Ya, tutup batch"
        >
          <p>
            Kolam akan tersedia untuk batch baru. Pakan, kematian, panen, dan
            penjualan baru tidak bisa dicatat lagi untuk batch ini.
          </p>
          {warnings.length > 0 && (
            <div className="closure-warnings">
              <strong>Perhatikan sebelum melanjutkan:</strong>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p>Pastikan Anda sudah meninjau catatan di atas.</p>
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function BatchSummary({ batch }) {
  const { state, transact, notify } = useStore();
  const [error, setError] = useState("");
  const summary = batchSummary(state, batch);
  function saveCost(event) {
    event.preventDefault();
    try {
      transact("SET_COST", {
        batchId: batch.id,
        biayaLain: new FormData(event.currentTarget).get("biayaLain"),
      });
      setError("");
      notify("Biaya lain berhasil diperbarui.");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="summary-content">
      <div className="stats-grid">
        <StatCard
          label="Pendapatan"
          value={rupiah(summary.revenue)}
          description="Termasuk penjualan belum lunas"
          icon={ShoppingBag}
        />
        <StatCard
          label="Total Biaya"
          value={rupiah(summary.cost)}
          description="Bibit + pakan + biaya lain"
          icon={Wheat}
          tone="sand"
        />
        <StatCard
          label="Laba Kotor"
          value={rupiah(summary.profit)}
          description={
            summary.margin === null
              ? "Margin belum tersedia"
              : `Margin ${number(summary.margin, 2)}%`
          }
          icon={TrendingUp}
          tone="forest"
        />
        <StatCard
          label="Mortality Rate"
          value={`${number(summary.mortality, 2)}%`}
          description={`${number(summary.deaths)} dari ${number(batch.jumlahBibit)} ekor bibit`}
          icon={Fish}
          tone="blue"
        />
      </div>
      <div className="summary-grid">
        <section className="panel breakdown-panel">
          <SectionHeader
            title="Rincian hasil usaha"
            description={
              batch.status === "selesai"
                ? "Rekap satu siklus budidaya."
                : "Ringkasan sementara, berubah seiring catatan baru."
            }
          />
          <dl className="breakdown">
            <div>
              <dt>Biaya bibit</dt>
              <dd>{rupiah(batch.hargaBibitTotal)}</dd>
            </div>
            <div>
              <dt>
                Biaya pakan <small>{number(summary.feedKg)} kg</small>
              </dt>
              <dd>{rupiah(summary.feedCost)}</dd>
            </div>
            <div>
              <dt>Biaya lain</dt>
              <dd>{rupiah(batch.biayaLain)}</dd>
            </div>
            <div className="breakdown-subtotal">
              <dt>Total biaya</dt>
              <dd>{rupiah(summary.cost)}</dd>
            </div>
            <div>
              <dt>Pendapatan penjualan</dt>
              <dd>{rupiah(summary.revenue)}</dd>
            </div>
            <div className="breakdown-profit">
              <dt>Laba kotor</dt>
              <dd className={summary.profit < 0 ? "negative" : ""}>
                {rupiah(summary.profit)}
              </dd>
            </div>
          </dl>
          <p className="muted-note">
            Laba kotor bukan saldo kas. Semua penjualan dihitung, termasuk yang
            belum dibayar.
          </p>
        </section>
        <div className="summary-right">
          <section className="panel harvest-summary">
            <SectionHeader title="Panen & penjualan" />
            <div className="harvest-amounts">
              <div>
                <span>Dipanen</span>
                <strong>
                  {number(summary.harvested)} <small>kg</small>
                </strong>
              </div>
              <ArrowConnector />
              <div>
                <span>Terjual</span>
                <strong>
                  {number(summary.sold)} <small>kg</small>
                </strong>
              </div>
            </div>
            <div className="summary-info-row">
              <span>Panen belum terjual</span>
              <strong>{number(summary.unsold)} kg</strong>
            </div>
            <div className="summary-info-row">
              <span>Piutang (belum lunas)</span>
              <strong>{rupiah(summary.outstanding)}</strong>
            </div>
          </section>
          {batch.status !== "selesai" && (
            <form className="panel cost-form" onSubmit={saveCost}>
              <h3>Biaya operasional lainnya</h3>
              <p>
                Satu total untuk persiapan kolam, transportasi, dan biaya
                lainnya.
              </p>
              <ErrorBox message={error} />
              <Field label="Total biaya lain (Rp)">
                <input
                  key={batch.id}
                  name="biayaLain"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  defaultValue={batch.biayaLain}
                  required
                />
              </Field>
              <button className="btn btn-secondary" type="submit">
                <Check size={16} /> Perbarui Biaya
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowConnector() {
  return (
    <span className="harvest-connector" aria-hidden="true">
      →
    </span>
  );
}

function RecordHistory({ kind, batch }) {
  const { state, transact, notify } = useStore();
  const [error, setError] = useState("");
  const [pendingSale, setPendingSale] = useState(null);
  const collection = {
    feed: "feedLogs",
    mortality: "mortalityLogs",
    harvest: "harvests",
    sale: "sales",
  }[kind];
  const rows = batchLogs(state, collection, batch)
    .slice()
    .sort(
      (a, b) =>
        b.tanggal.localeCompare(a.tanggal) ||
        (b.createdAt || 0) - (a.createdAt || 0),
    );
  const title = {
    feed: "Riwayat pakan",
    mortality: "Riwayat kematian",
    harvest: "Riwayat panen",
    sale: "Riwayat penjualan",
  }[kind];
  function markPaid() {
    try {
      transact("MARK_PAID", { saleId: pendingSale.id });
      notify("Pembayaran berhasil ditandai lunas.");
      setPendingSale(null);
    } catch (err) {
      setPendingSale(null);
      setError(err.message);
    }
  }
  return (
    <section className="panel record-history">
      <SectionHeader
        title={title}
        description={`${rows.length} catatan tersimpan`}
      />
      <ErrorBox message={error} />
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={title}
        >
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                {kind === "feed" && (
                  <>
                    <th>Jenis pakan</th>
                    <th>Berat</th>
                    <th>Biaya</th>
                  </>
                )}
                {kind === "mortality" && (
                  <>
                    <th>Jumlah</th>
                    <th>Catatan</th>
                  </>
                )}
                {kind === "harvest" && (
                  <>
                    <th>Berat</th>
                    <th>Jumlah ikan</th>
                  </>
                )}
                {kind === "sale" && (
                  <>
                    <th>Klien</th>
                    <th>Berat / Harga</th>
                    <th>Total</th>
                    <th>Pembayaran</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.tanggal)}</td>
                  {kind === "feed" && (
                    <>
                      <td>{row.jenis}</td>
                      <td>{number(row.kg)} kg</td>
                      <td>{rupiah(row.biaya)}</td>
                    </>
                  )}
                  {kind === "mortality" && (
                    <>
                      <td>{number(row.ekor)} ekor</td>
                      <td className="wrap-cell">{row.catatan || "—"}</td>
                    </>
                  )}
                  {kind === "harvest" && (
                    <>
                      <td>{number(row.beratKg)} kg</td>
                      <td>
                        {row.ekor === null
                          ? "Tidak dicatat"
                          : `${number(row.ekor)} ekor`}
                      </td>
                    </>
                  )}
                  {kind === "sale" && (
                    <>
                      <td className="wrap-cell">
                        {
                          state.clients.find(
                            (client) => client.id === row.clientId,
                          )?.nama
                        }
                      </td>
                      <td>
                        {number(row.beratKg)} kg
                        <small>{rupiah(row.hargaPerKg)} / kg</small>
                      </td>
                      <td className="money-cell">
                        {rupiah(row.beratKg * row.hargaPerKg)}
                      </td>
                      <td>
                        <StatusBadge status={row.lunas ? "lunas" : "belum"} />
                        {!row.lunas && (
                          <button
                            className="text-button payment-button"
                            onClick={() => setPendingSale(row)}
                          >
                            Tandai Lunas
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingSale && (
        <ConfirmDialog
          title="Tandai penjualan lunas?"
          confirmLabel="Ya, sudah lunas"
          onClose={() => setPendingSale(null)}
          onConfirm={markPaid}
        >
          <p>
            Konfirmasi pembayaran penuh sebesar{" "}
            <strong>
              {rupiah(pendingSale.beratKg * pendingSale.hargaPerKg)}
            </strong>{" "}
            sudah diterima. Nilai pendapatan tidak berubah, tetapi piutang akan
            berkurang.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
