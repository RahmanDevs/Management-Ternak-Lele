import { ClipboardList, Wheat } from "lucide-react";
import { useStore } from "../store/Store";
import { formatDate, number } from "../lib/format";
import { EmptyState } from "./UI";

export default function ActivityList({ items }) {
  const { state } = useStore();
  if (!items.length)
    return (
      <EmptyState
        title="Belum ada aktivitas"
        description="Mulai catat pakan atau kematian untuk melihat riwayat harian."
      />
    );
  return (
    <ul className="activity-list">
      {items.map((item) => {
        const batch = state.batches.find((entry) => entry.id === item.batchId);
        const pond = state.ponds.find((entry) => entry.id === batch?.pondId);
        const Icon = item.kind === "feed" ? Wheat : ClipboardList;
        return (
          <li key={item.id}>
            <span className={`activity-icon ${item.kind}`}>
              <Icon size={19} />
            </span>
            <div className="activity-copy">
              <strong>{item.title}</strong>
              <span>
                {pond?.nama} · {batch?.kode}
              </span>
              {item.detail && <p>{item.detail}</p>}
            </div>
            <div className="activity-right">
              <strong>
                {number(item.amount)} <small>{item.unit}</small>
              </strong>
              <time dateTime={item.tanggal}>{formatDate(item.tanggal)}</time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
