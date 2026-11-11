import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Fish, Plus, Search } from "lucide-react";
import { useStore } from "../store/Store";
import { batchAge, batchSummary, expectedHarvest } from "../lib/calc";
import { formatDate, number, rupiah } from "../lib/format";
import { EmptyState, PageHeader, StatusBadge } from "../components/UI";

export default function Batches() {
  const { state } = useStore();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const batches = state.batches.filter(
    (batch) =>
      (status === "all" || batch.status === status) &&
      `${batch.kode} ${state.ponds.find((pond) => pond.id === batch.pondId)?.nama}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="SETIAP SIKLUS PUNYA CERITA"
        title="Daftar batch"
        description="Pantau perjalanan budidaya, dari bibit pertama hingga panen terakhir."
        action={
          <Link className="btn btn-primary" to="/batches/new">
            <Plus size={18} /> Mulai Batch Baru
          </Link>
        }
      />
      <section className="panel batch-table-panel">
        <div className="table-toolbar">
          <div className="filter-pills" aria-label="Filter status batch">
            {[
              ["all", "Semua"],
              ["aktif", "Aktif"],
              ["panen", "Panen"],
              ["selesai", "Selesai"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={status === value ? "selected" : ""}
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
              >
                {label}
                <span>
                  {
                    state.batches.filter(
                      (batch) => value === "all" || batch.status === value,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="search-input">
            <Search size={18} />
            <input
              type="search"
              aria-label="Cari batch atau kolam"
              placeholder="Cari batch atau kolam..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {batches.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Daftar batch budidaya"
          >
            <table>
              <thead>
                <tr>
                  <th>Batch / Kolam</th>
                  <th>Status</th>
                  <th>Tanggal tebar</th>
                  <th>Umur</th>
                  <th>Estimasi panen</th>
                  <th>Bibit awal</th>
                  <th>Laba kotor</th>
                  <th>
                    <span className="sr-only">Detail</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const summary = batchSummary(state, batch);
                  return (
                    <tr key={batch.id}>
                      <td>
                        <div className="table-batch">
                          <span className="table-fish">
                            <Fish size={21} />
                          </span>
                          <div>
                            <strong>{batch.kode}</strong>
                            <span>
                              {
                                state.ponds.find(
                                  (pond) => pond.id === batch.pondId,
                                )?.nama
                              }
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={batch.status} />
                      </td>
                      <td>{formatDate(batch.tanggalTebar)}</td>
                      <td>
                        {batchAge(
                          batch.tanggalTebar,
                          batch.tanggalSelesai || undefined,
                        )}{" "}
                        hari
                      </td>
                      <td>{formatDate(expectedHarvest(batch.tanggalTebar))}</td>
                      <td>{number(batch.jumlahBibit)} ekor</td>
                      <td
                        className={`money-cell ${summary.profit < 0 ? "negative" : "positive"}`}
                      >
                        {rupiah(summary.profit)}
                        {batch.status !== "selesai" && <small>Sementara</small>}
                      </td>
                      <td>
                        <Link
                          className="round-link"
                          to={`/batches/${batch.id}`}
                          aria-label={`Detail ${batch.kode}`}
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Tidak ada batch yang cocok"
            description="Coba kata kunci atau status lain, atau mulai batch baru."
          />
        )}
        <div className="table-footer">
          Menampilkan {batches.length} dari {state.batches.length} batch
          <span>Laba kotor = pendapatan − total biaya</span>
        </div>
      </section>
    </div>
  );
}
