import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Fish,
  Sun,
  Wheat,
} from "lucide-react";
import { useStore } from "../store/Store";
import {
  batchAge,
  batchSummary,
  daysToHarvest,
  recentActivity,
  sum,
} from "../lib/calc";
import { number, todayJakarta } from "../lib/format";
import {
  EmptyState,
  PageHeader,
  PondIllustration,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "../components/UI";
import ActivityList from "../components/ActivityList";

export default function WorkerHome() {
  const { state } = useStore();
  const active = state.batches.filter((batch) => batch.status !== "selesai");
  const today = todayJakarta();
  const feeds = state.feedLogs.filter((log) => log.tanggal === today);
  const deaths = state.mortalityLogs.filter((log) => log.tanggal === today);
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="RUANG KERJA FARM WORKER"
        title="Hari baik dimulai dari kolam."
        description="Sedikit perhatian setiap hari, untuk ikan yang tumbuh lebih baik."
      />
      <div className="worker-greeting">
        <Sun size={28} />
        <div>
          <strong>Halo, Farm Worker!</strong>
          <p>Yuk, rawat dan catat perkembangan kolam hari ini.</p>
        </div>
      </div>
      <div className="stats-grid worker-stats">
        <StatCard
          label="Batch Berjalan"
          value={active.length}
          unit="batch"
          description="Kolam yang perlu diperhatikan"
          icon={Fish}
        />
        <StatCard
          label="Pakan Hari Ini"
          value={number(sum(feeds, (item) => item.kg))}
          unit="kg"
          description={`${feeds.length} catatan tersimpan`}
          icon={Wheat}
          tone="sand"
        />
        <StatCard
          label="Kematian Hari Ini"
          value={number(sum(deaths, (item) => item.ekor))}
          unit="ekor"
          description={`${deaths.length} catatan tersimpan`}
          icon={ClipboardList}
          tone="blue"
        />
      </div>
      <section className="section-block">
        <SectionHeader
          title="Kolam yang Anda rawat"
          description="Pilih batch untuk menambahkan catatan harian."
        />
        {!active.length ? (
          <section className="panel">
            <EmptyState
              title="Semua kolam sedang beristirahat"
              description="Owner belum memulai batch baru. Riwayat catatan Anda tetap tersedia."
              action={
                <Link className="btn btn-secondary" to="/history">
                  Lihat Riwayat
                </Link>
              }
            />
          </section>
        ) : (
          <div className="worker-pond-grid">
            {active.map((batch) => {
              const summary = batchSummary(state, batch);
              const fed = feeds.some((feed) => feed.batchId === batch.id);
              const remaining = daysToHarvest(batch.tanggalTebar);
              return (
                <article key={batch.id} className="panel worker-pond-card">
                  <div className="worker-pond-top">
                    <div>
                      <span className="eyebrow">{batch.kode}</span>
                      <h3>
                        {
                          state.ponds.find((pond) => pond.id === batch.pondId)
                            ?.nama
                        }
                      </h3>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                  <PondIllustration />
                  <div className="worker-pond-facts">
                    <div>
                      <span>Umur batch</span>
                      <strong>{batchAge(batch.tanggalTebar)} hari</strong>
                    </div>
                    <div>
                      <span>Total pakan</span>
                      <strong>{number(summary.feedKg)} kg</strong>
                    </div>
                    <div>
                      <span>Kematian</span>
                      <strong>{number(summary.mortality, 1)}%</strong>
                    </div>
                  </div>
                  <p className={`daily-check ${fed ? "done" : ""}`}>
                    {fed ? <CheckCircle2 size={16} /> : <Wheat size={16} />}
                    {fed
                      ? "Pakan hari ini sudah tercatat"
                      : "Belum ada catatan pakan hari ini"}
                  </p>
                  <div className="worker-pond-actions">
                    <Link
                      className="btn btn-primary"
                      to={`/feed?batch=${batch.id}`}
                    >
                      <Wheat size={17} /> Catat Pakan
                    </Link>
                    <Link
                      className="btn btn-secondary"
                      to={`/mortality?batch=${batch.id}`}
                    >
                      <ClipboardList size={17} /> Kematian
                    </Link>
                  </div>
                  <p className="worker-harvest-estimate">
                    {remaining > 0
                      ? `${remaining} hari menuju perkiraan panen`
                      : "Sudah mencapai perkiraan waktu panen"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className="panel worker-history">
        <SectionHeader
          title="Catatan terbaru"
          action={
            <Link to="/history" className="text-button">
              Semua riwayat <ArrowRight size={16} />
            </Link>
          }
        />
        <ActivityList items={recentActivity(state).slice(0, 4)} />
      </section>
    </div>
  );
}
