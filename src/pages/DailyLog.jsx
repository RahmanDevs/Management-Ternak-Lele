import { NavLink, useSearchParams } from "react-router-dom";
import { ClipboardList, Wheat } from "lucide-react";
import { useStore } from "../store/Store";
import { recentActivity } from "../lib/calc";
import { PageHeader, SectionHeader, TipCard } from "../components/UI";
import RecordForm from "../components/RecordForm";
import ActivityList from "../components/ActivityList";

export default function DailyLog({ kind }) {
  const { state } = useStore();
  const [params] = useSearchParams();
  const items = recentActivity(state)
    .filter((item) => item.kind === kind)
    .slice(0, 5);
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="KEBIASAAN KECIL, DAMPAK BESAR"
        title={
          kind === "feed"
            ? "Pakan hari ini, tumbuh esok hari."
            : "Pantau kondisi, jaga pertumbuhan."
        }
        description="Catatan harian yang sederhana untuk budidaya yang lebih terarah."
      />
      <nav className="daily-switch" aria-label="Jenis catatan">
        <NavLink to="/feed">
          <Wheat size={18} /> Pakan
        </NavLink>
        <NavLink to="/mortality">
          <ClipboardList size={18} /> Kematian
        </NavLink>
      </nav>
      <div className="form-layout daily-layout">
        <RecordForm
          key={`${kind}-${params.get("batch")}`}
          kind={kind}
          initialBatchId={params.get("batch")}
        />
        <aside className="form-aside">
          <section className="panel daily-recent">
            <SectionHeader title="Baru saja dicatat" />
            <ActivityList items={items} />
          </section>
          <TipCard title="Konsisten itu berarti">
            {kind === "feed"
              ? "Catat pakan segera setelah pemberian. Anda dapat menyimpan beberapa catatan pada tanggal yang sama untuk jadwal pagi dan sore."
              : "Catat jumlah kematian yang sebenarnya, termasuk 0 jika tidak ada. Tambahkan catatan kondisi ikan untuk membantu pemantauan."}
          </TipCard>
        </aside>
      </div>
    </div>
  );
}
