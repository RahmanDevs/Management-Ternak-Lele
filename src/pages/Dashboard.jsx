import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Fish,
  Leaf,
  Plus,
  Scale,
  TrendingUp,
  Wallet,
  Waves,
} from "lucide-react";
import { useStore } from "../store/Store";
import { batchSummary, daysToHarvest, recentActivity, sum } from "../lib/calc";
import { number, rupiah } from "../lib/format";
import {
  EmptyState,
  OwnerOnly,
  PageHeader,
  SectionHeader,
  StatCard,
} from "../components/UI";
import PondCard from "../components/PondCard";
import ActivityList from "../components/ActivityList";

export default function Dashboard() {
  const { state } = useStore();
  const active = state.batches.filter((batch) => batch.status !== "selesai");
  const completed = state.batches.filter((batch) => batch.status === "selesai");
  const summaries = state.batches.map((batch) => batchSummary(state, batch));
  const nearHarvest = active.filter(
    (batch) => daysToHarvest(batch.tanggalTebar) <= 14,
  );
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="GAMBARAN FARM ANDA"
        title="Budidaya terpantau, hati tenang."
        description="Lihat perkembangan kolam dan hasil kerja Anda, dalam satu tempat."
        action={
          <Link className="btn btn-primary" to="/batches/new">
            <Plus size={18} /> Mulai Batch Baru
          </Link>
        }
      />
      <div className="dashboard-banner">
        <div className="banner-leaf">
          <Leaf size={24} strokeWidth={1.5} />
        </div>
        <div>
          <strong>Selamat datang kembali, Pemilik Farm!</strong>
          <p>
            {active.length
              ? `${active.length} batch sedang bertumbuh. Yuk, pastikan setiap kolam mendapat perhatian hari ini.`
              : "Kolam siap untuk perjalanan baru. Mulai batch dan tumbuhkan hasil berikutnya."}
          </p>
        </div>
        <span className="banner-farm">
          <Waves size={16} /> Farm Demo <span>·</span> 3 kolam
        </span>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Batch Aktif"
          value={active.length}
          unit="batch"
          description={`${3 - active.length} kolam tersedia untuk batch baru`}
          icon={Fish}
        />
        <StatCard
          label="Total Hasil Panen"
          value={number(sum(summaries, (item) => item.harvested))}
          unit="kg"
          description="Akumulasi seluruh batch"
          icon={Scale}
          tone="sand"
        />
        <OwnerOnly>
          <StatCard
            label="Total Pendapatan"
            value={rupiah(sum(summaries, (item) => item.revenue))}
            description="Semua penjualan, termasuk belum lunas"
            icon={Wallet}
            tone="blue"
          />
          <StatCard
            label="Laba Batch Selesai"
            value={rupiah(
              sum(completed, (batch) => batchSummary(state, batch).profit),
            )}
            description={`Laba kotor dari ${completed.length} batch selesai`}
            icon={TrendingUp}
            tone="forest"
          />
        </OwnerOnly>
      </div>
      {nearHarvest.length > 0 && (
        <div className="notice notice-harvest">
          <CalendarDays size={20} />
          <div>
            <strong>Mendekati waktu panen</strong>
            <p>
              {nearHarvest
                .map(
                  (batch) =>
                    `${state.ponds.find((pond) => pond.id === batch.pondId)?.nama} (${batch.kode})`,
                )
                .join(", ")}{" "}
              sudah mendekati atau melewati estimasi panen. Periksa kesiapan
              ikan sebelum panen.
            </p>
          </div>
          <Link to={`/batches/${nearHarvest[0].id}`} className="text-button">
            Lihat batch <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <section className="section-block">
        <SectionHeader
          title="Kabar dari kolam"
          description="Tiga kolam, satu pandangan menyeluruh."
          action={
            <Link className="text-button" to="/batches">
              Semua batch <ArrowRight size={16} />
            </Link>
          }
        />
        <div className="pond-grid">
          {state.ponds.map((pond) => (
            <PondCard key={pond.id} pond={pond} />
          ))}
        </div>
      </section>
      <div className="dashboard-bottom">
        <OwnerOnly>
          <FinancialOverview />
        </OwnerOnly>
        <section className="panel activity-panel">
          <SectionHeader
            title="Aktivitas terbaru"
            description="Catatan kecil, perkembangan berarti."
            action={
              <Link
                className="round-link"
                to="/history"
                aria-label="Lihat semua aktivitas"
              >
                <ArrowUpRight size={18} />
              </Link>
            }
          />
          <ActivityList items={recentActivity(state).slice(0, 4)} />
          <Link className="panel-bottom-link" to="/history">
            Lihat semua aktivitas <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}

function FinancialOverview() {
  const { state } = useStore();
  const [selected, setSelected] = useState(
    state.batches.find((batch) => batch.status === "selesai")?.id ||
      state.batches[0]?.id ||
      "",
  );
  const batch =
    state.batches.find((item) => item.id === selected) || state.batches[0];
  const summary = batch ? batchSummary(state, batch) : null;
  const max = summary
    ? Math.max(summary.revenue, summary.cost, Math.abs(summary.profit), 1)
    : 1;
  return (
    <section className="panel finance-panel">
      <SectionHeader
        title="Hasil dari setiap usaha"
        description="Ringkasan keuangan per batch."
        action={
          batch && (
            <select
              className="compact-select"
              aria-label="Pilih batch ringkasan keuangan"
              value={batch.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {state.batches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode}
                </option>
              ))}
            </select>
          )
        }
      />
      {!summary ? (
        <EmptyState />
      ) : (
        <>
          <div className="finance-headline">
            <div>
              <span>Laba kotor {batch.kode}</span>
              <strong className={summary.profit < 0 ? "negative" : ""}>
                {rupiah(summary.profit)}
              </strong>
            </div>
            <span
              className={`margin-badge ${summary.profit < 0 ? "negative" : ""}`}
            >
              <TrendingUp size={15} />
              {summary.margin === null
                ? "Belum ada penjualan"
                : `Margin ${number(summary.margin, 1)}%`}
            </span>
          </div>
          <div className="finance-bars">
            {[
              { label: "Pendapatan", value: summary.revenue, key: "revenue" },
              { label: "Total biaya", value: summary.cost, key: "cost" },
              { label: "Laba kotor", value: summary.profit, key: "profit" },
            ].map((item) => (
              <div className={`finance-bar-row ${item.key}`} key={item.key}>
                <div>
                  <span>{item.label}</span>
                  <strong>{rupiah(item.value)}</strong>
                </div>
                <div className="finance-bar-track">
                  <span
                    className={item.value < 0 ? "bar-negative" : ""}
                    style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="finance-footnote">
            <span>
              <span className="legend-dot" /> Berdasarkan catatan aktual
            </span>
            <Link className="text-button" to={`/batches/${batch.id}`}>
              Detail ringkasan <ArrowUpRight size={15} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
