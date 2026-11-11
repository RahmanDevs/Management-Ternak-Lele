import { createSeed } from "../data/seed";

export const STORAGE_KEY = "leleku.demo.v1";
export const SESSION_KEY = "leleku.session.v1";
const text = (value) => typeof value === "string" && value.length > 0;
const amount = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const date = (value) =>
  text(value) &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

export function isValidState(state) {
  if (!state || !text(state.farm?.id) || !text(state.farm?.nama)) return false;
  const collections = [
    "ponds",
    "suppliers",
    "clients",
    "batches",
    "feedLogs",
    "mortalityLogs",
    "harvests",
    "sales",
  ];
  if (
    !collections.every(
      (key) =>
        Array.isArray(state[key]) &&
        state[key].every((item) => item && text(item.id)) &&
        new Set(state[key].map((item) => item.id)).size === state[key].length,
    )
  )
    return false;
  if (
    state.ponds.length !== 3 ||
    !state.ponds.every(
      (item) => text(item.nama) && item.farmId === state.farm.id,
    )
  )
    return false;
  if (![...state.suppliers, ...state.clients].every((item) => text(item.nama)))
    return false;
  if (
    !state.batches.every(
      (batch) =>
        text(batch.kode) &&
        date(batch.tanggalTebar) &&
        amount(batch.jumlahBibit) &&
        batch.jumlahBibit > 0 &&
        Number.isInteger(batch.jumlahBibit) &&
        amount(batch.hargaBibitTotal) &&
        amount(batch.biayaLain) &&
        ["aktif", "panen", "selesai"].includes(batch.status) &&
        (batch.status !== "selesai" || date(batch.tanggalSelesai)) &&
        batch.farmId === state.farm.id &&
        state.ponds.some((pond) => pond.id === batch.pondId) &&
        state.suppliers.some((item) => item.id === batch.supplierId),
    )
  )
    return false;
  if (
    !state.ponds.every(
      (pond) =>
        state.batches.filter(
          (batch) => batch.pondId === pond.id && batch.status !== "selesai",
        ).length <= 1,
    )
  )
    return false;
  const validLog = (log) =>
    date(log.tanggal) &&
    state.batches.some(
      (batch) =>
        batch.id === log.batchId &&
        log.tanggal >= batch.tanggalTebar &&
        (!batch.tanggalSelesai || log.tanggal <= batch.tanggalSelesai),
    );
  return (
    state.feedLogs.every(
      (item) =>
        validLog(item) &&
        text(item.jenis) &&
        amount(item.kg) &&
        amount(item.biaya),
    ) &&
    state.mortalityLogs.every(
      (item) =>
        validLog(item) &&
        amount(item.ekor) &&
        Number.isInteger(item.ekor) &&
        typeof item.catatan === "string",
    ) &&
    state.harvests.every(
      (item) =>
        validLog(item) &&
        amount(item.beratKg) &&
        (item.ekor === null ||
          (amount(item.ekor) && Number.isInteger(item.ekor))),
    ) &&
    state.sales.every(
      (item) =>
        validLog(item) &&
        amount(item.beratKg) &&
        amount(item.hargaPerKg) &&
        typeof item.lunas === "boolean" &&
        state.clients.some((client) => client.id === item.clientId),
    )
  );
}

export function loadState(storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY);
    if (!raw) return { state: createSeed(), warning: "" };
    const stored = JSON.parse(raw);
    if (stored.version !== 1 || !isValidState(stored.data))
      throw new Error("Invalid data");
    return { state: stored.data, warning: "" };
  } catch {
    return {
      state: createSeed(),
      warning:
        "Data lokal tidak dapat dibaca. Data demo dimuat; penyimpanan mungkin hanya tersedia selama halaman ini terbuka.",
    };
  }
}

export function saveState(state, storage) {
  try {
    (storage ?? window.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, data: state }),
    );
    return true;
  } catch {
    return false;
  }
}
