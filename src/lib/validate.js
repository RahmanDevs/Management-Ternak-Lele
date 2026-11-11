import { activeBatchForPond, batchSummary } from "./calc";
import { number, todayJakarta } from "./format";

export function requireOwner(role) {
  if (role !== "owner")
    throw new Error("Tindakan ini hanya dapat dilakukan oleh Owner.");
}

export function numeric(
  value,
  label,
  { positive = false, integer = false } = {},
) {
  if (
    !["number", "string"].includes(typeof value) ||
    (typeof value === "string" && !value.trim())
  )
    throw new Error(`${label} wajib diisi.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || (positive && parsed === 0)) {
    throw new Error(
      `${label} harus berupa angka ${positive ? "lebih dari 0" : "tidak negatif"}.`,
    );
  }
  if (integer && !Number.isSafeInteger(parsed))
    throw new Error(`${label} harus berupa bilangan bulat yang valid.`);
  if (!integer && Math.abs(parsed * 100 - Math.round(parsed * 100)) > 0.00001)
    throw new Error(`${label} maksimal dua angka desimal.`);
  if (parsed > 1e12) throw new Error(`${label} terlalu besar.`);
  return parsed;
}

export function validDate(value, label = "Tanggal") {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value || "") ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} tidak valid.`);
  }
  if (value > todayJakarta())
    throw new Error(`${label} tidak boleh setelah hari ini.`);
  return value;
}

export function logDate(batch, date) {
  validDate(date);
  if (date < batch.tanggalTebar)
    throw new Error("Tanggal catatan tidak boleh sebelum tanggal tebar.");
  if (batch.tanggalSelesai && date > batch.tanggalSelesai)
    throw new Error("Tanggal catatan tidak boleh setelah batch selesai.");
}

export function validateNewBatch(state, payload) {
  const pond = state.ponds.find((item) => item.id === payload.pondId);
  if (!pond) throw new Error("Pilih kolam yang valid.");
  if (activeBatchForPond(state, pond.id))
    throw new Error(
      `${pond.nama} masih memiliki batch Aktif atau Panen. Selesaikan batch tersebut terlebih dahulu.`,
    );
  if (!state.suppliers.some((item) => item.id === payload.supplierId))
    throw new Error("Pilih pemasok bibit.");
  return {
    pondId: pond.id,
    farmId: pond.farmId,
    supplierId: payload.supplierId,
    tanggalTebar: validDate(payload.tanggalTebar, "Tanggal tebar"),
    jumlahBibit: numeric(payload.jumlahBibit, "Jumlah bibit", {
      positive: true,
      integer: true,
    }),
    hargaBibitTotal: numeric(payload.hargaBibitTotal, "Biaya bibit", {
      integer: true,
    }),
    biayaLain: numeric(payload.biayaLain ?? 0, "Biaya lain", { integer: true }),
  };
}

export function validateSale(state, batch, payload) {
  logDate(batch, payload.tanggal);
  if (!state.clients.some((item) => item.id === payload.clientId))
    throw new Error("Pilih klien yang valid.");
  if (typeof payload.lunas !== "boolean")
    throw new Error("Pilih status pembayaran yang valid.");
  const beratKg = numeric(payload.beratKg, "Berat jual", { positive: true });
  const hargaPerKg = numeric(payload.hargaPerKg, "Harga per kg", {
    integer: true,
  });
  if (!Number.isSafeInteger(Math.round(beratKg * hargaPerKg)))
    throw new Error("Total penjualan terlalu besar.");
  const summary = batchSummary(state, batch);
  if (Math.round(beratKg * 100) > Math.round(summary.unsold * 100)) {
    throw new Error(
      `Berat jual melebihi sisa panen. Maksimal ${number(summary.unsold)} kg tersedia.`,
    );
  }
  const dailyStock = new Map();
  const addStock = (date, amount) =>
    dailyStock.set(date, (dailyStock.get(date) || 0) + amount);
  state.harvests
    .filter((item) => item.batchId === batch.id)
    .forEach((item) => addStock(item.tanggal, Math.round(item.beratKg * 100)));
  state.sales
    .filter((item) => item.batchId === batch.id)
    .forEach((item) => addStock(item.tanggal, -Math.round(item.beratKg * 100)));
  addStock(payload.tanggal, -Math.round(beratKg * 100));
  let available = 0;
  for (const date of [...dailyStock.keys()].sort()) {
    available += dailyStock.get(date);
    if (available < 0)
      throw new Error(
        "Berat panen pada tanggal penjualan belum mencukupi. Periksa tanggal panen dan penjualan.",
      );
  }
  return {
    clientId: payload.clientId,
    tanggal: payload.tanggal,
    beratKg,
    hargaPerKg,
    lunas: payload.lunas,
  };
}

export function closureWarnings(state, batch) {
  const summary = batchSummary(state, batch);
  const warnings = [];
  if (summary.unsold > 0)
    warnings.push(`${number(summary.unsold)} kg hasil panen belum terjual.`);
  if (summary.outstanding > 0)
    warnings.push("Masih ada penjualan dengan status Belum Lunas.");
  if (!summary.harvested)
    warnings.push("Batch ini belum memiliki catatan panen.");
  return warnings;
}
