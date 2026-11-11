import { createSeed } from "../data/seed";
import { batchSummary, sum } from "../lib/calc";
import { todayJakarta } from "../lib/format";
import {
  closureWarnings,
  logDate,
  numeric,
  requireOwner,
  validateNewBatch,
  validateSale,
} from "../lib/validate";

const ownerActions = [
  "NEW_BATCH",
  "HARVEST",
  "SALE",
  "CLOSE_BATCH",
  "SET_COST",
  "MARK_PAID",
  "RESET",
];
const newId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function applyAction(state, role, type, payload = {}) {
  if (!["owner", "worker"].includes(role))
    throw new Error("Silakan masuk terlebih dahulu.");
  if (ownerActions.includes(type)) requireOwner(role);
  if (type === "RESET") return { state: createSeed() };
  if (type === "NEW_BATCH") {
    const data = validateNewBatch(state, payload);
    const sequence =
      Math.max(
        0,
        ...state.batches.map((item) => Number(item.kode.split("-")[1]) || 0),
      ) + 1;
    const batch = {
      ...data,
      id: newId(),
      kode: `LL-${String(sequence).padStart(3, "0")}`,
      status: "aktif",
      tanggalSelesai: null,
    };
    return {
      state: { ...state, batches: [batch, ...state.batches] },
      id: batch.id,
    };
  }
  if (type === "MARK_PAID") {
    if (!state.sales.some((item) => item.id === payload.saleId))
      throw new Error("Penjualan tidak ditemukan.");
    return {
      state: {
        ...state,
        sales: state.sales.map((item) =>
          item.id === payload.saleId ? { ...item, lunas: true } : item,
        ),
      },
    };
  }
  const batch = state.batches.find((item) => item.id === payload.batchId);
  if (!batch) throw new Error("Batch tidak ditemukan.");
  if (batch.status === "selesai")
    throw new Error(
      "Batch sudah selesai. Catatan tidak dapat ditambahkan atau diubah.",
    );
  const updateBatch = (changes) => ({
    ...state,
    batches: state.batches.map((item) =>
      item.id === batch.id ? { ...item, ...changes } : item,
    ),
  });
  if (type === "SET_COST")
    return {
      state: updateBatch({
        biayaLain: numeric(payload.biayaLain, "Biaya lain", { integer: true }),
      }),
    };
  if (type === "CLOSE_BATCH") {
    if (closureWarnings(state, batch).length && payload.confirmed !== true)
      throw new Error("Konfirmasi peringatan sebelum menutup batch.");
    return {
      state: updateBatch({ status: "selesai", tanggalSelesai: todayJakarta() }),
    };
  }
  logDate(batch, payload.tanggal);
  const base = {
    id: newId(),
    batchId: batch.id,
    tanggal: payload.tanggal,
    createdAt: Date.now(),
  };
  if (type === "FEED") {
    const jenis = String(payload.jenis || "").trim();
    if (!jenis) throw new Error("Jenis pakan wajib diisi.");
    if (
      role === "worker" &&
      payload.biaya !== undefined &&
      Number(payload.biaya) !== 0
    )
      requireOwner(role);
    const log = {
      ...base,
      jenis: jenis.slice(0, 100),
      kg: numeric(payload.kg, "Berat pakan"),
      biaya:
        role === "owner"
          ? numeric(payload.biaya ?? 0, "Biaya pakan", { integer: true })
          : 0,
    };
    return { state: { ...state, feedLogs: [log, ...state.feedLogs] } };
  }
  if (type === "MORTALITY") {
    const ekor = numeric(payload.ekor, "Jumlah kematian", { integer: true });
    const summary = batchSummary(state, batch);
    const harvestedCount = sum(
      state.harvests.filter((item) => item.batchId === batch.id),
      (item) => item.ekor || 0,
    );
    if (summary.deaths + harvestedCount + ekor > batch.jumlahBibit)
      throw new Error("Jumlah kematian melebihi sisa ikan yang tercatat.");
    return {
      state: {
        ...state,
        mortalityLogs: [
          {
            ...base,
            ekor,
            catatan: String(payload.catatan || "")
              .trim()
              .slice(0, 1000),
          },
          ...state.mortalityLogs,
        ],
      },
    };
  }
  if (type === "HARVEST") {
    const beratKg = numeric(payload.beratKg, "Berat panen", { positive: true });
    const ekor =
      payload.ekor === "" || payload.ekor == null
        ? null
        : numeric(payload.ekor, "Jumlah ikan", { integer: true });
    const harvestedCount = sum(
      state.harvests.filter((item) => item.batchId === batch.id),
      (item) => item.ekor || 0,
    );
    if (
      harvestedCount + (ekor || 0) + batchSummary(state, batch).deaths >
      batch.jumlahBibit
    )
      throw new Error("Jumlah ikan panen melebihi sisa ikan yang tercatat.");
    return {
      state: {
        ...updateBatch({ status: "panen" }),
        harvests: [{ ...base, beratKg, ekor }, ...state.harvests],
      },
    };
  }
  if (type === "SALE")
    return {
      state: {
        ...state,
        sales: [
          { ...base, ...validateSale(state, batch, payload) },
          ...state.sales,
        ],
      },
    };
  throw new Error("Tindakan tidak dikenali.");
}
