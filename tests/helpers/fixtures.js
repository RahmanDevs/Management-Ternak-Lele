import { todayJakarta } from "../../src/lib/format";
import { applyAction } from "../../src/store/actions";

export const newBatch = (overrides = {}) => ({
  pondId: "pond-c",
  supplierId: "supplier-1",
  tanggalTebar: todayJakarta(),
  jumlahBibit: 1000,
  hargaBibitTotal: 300000,
  biayaLain: 50000,
  ...overrides,
});

export const apply = (state, type, payload, role = "owner") =>
  applyAction(state, role, type, payload);

export const harvest = (state, weight = 100) =>
  apply(state, "HARVEST", {
    batchId: "batch-a",
    tanggal: todayJakarta(),
    beratKg: weight,
  }).state;

export const sale = (overrides = {}) => ({
  batchId: "batch-a",
  tanggal: todayJakarta(),
  clientId: "client-1",
  beratKg: 50,
  hargaPerKg: 25000,
  lunas: false,
  ...overrides,
});
