import { useState } from "react";
import { useStore } from "../store/Store";
import { recentActivity } from "../lib/calc";
import { PageHeader, Field } from "../components/UI";
import ActivityList from "../components/ActivityList";

export default function History() {
  const { state } = useStore();
  const [batch, setBatch] = useState("all");
  const [kind, setKind] = useState("all");
  const [date, setDate] = useState("");
  const items = recentActivity(state).filter(
    (item) =>
      (batch === "all" || item.batchId === batch) &&
      (kind === "all" || item.kind === kind) &&
      (!date || item.tanggal === date),
  );
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="JEJAK PERAWATAN FARM"
        title="Setiap catatan punya arti."
        description="Lihat kembali aktivitas pakan dan kematian pada seluruh batch."
      />
      <section className="panel history-panel">
        <div className="history-filters">
          <Field label="Batch / Kolam">
            <select
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
            >
              <option value="all">Semua batch</option>
              {state.batches.map((item) => (
                <option key={item.id} value={item.id}>
                  {state.ponds.find((pond) => pond.id === item.pondId)?.nama} ·{" "}
                  {item.kode}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jenis catatan">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="all">Semua catatan</option>
              <option value="feed">Pakan</option>
              <option value="mortality">Kematian</option>
            </select>
          </Field>
          <Field label="Tanggal">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setBatch("all");
              setKind("all");
              setDate("");
            }}
          >
            Reset Filter
          </button>
        </div>
        <div className="history-results">{items.length} catatan ditemukan</div>
        <ActivityList items={items} />
      </section>
    </div>
  );
}
