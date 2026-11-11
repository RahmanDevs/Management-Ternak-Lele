import { describe, expect, it } from "vitest";
import { createSeed } from "../../src/data/seed";
import { batchSummary } from "../../src/lib/calc";
import { addDays, todayJakarta } from "../../src/lib/format";
import { numeric } from "../../src/lib/validate";
import { isValidState } from "../../src/store/persistence";
import { apply, harvest, newBatch, sale } from "../helpers/fixtures";

describe("Boundary and regression cases", () => {
  it.each([
    ["whitespace", "   "],
    ["true", true],
    ["false", false],
    ["an object", {}],
    ["undefined", undefined],
  ])("BND-01 rejects %s as a numeric value", (_label, value) => {
    expect(() => numeric(value, "Jumlah")).toThrow(/wajib diisi/);
  });

  it("BND-02 enforces decimal precision, positive weights, and numeric limits", () => {
    expect(numeric("1.25", "Berat")).toBe(1.25);
    expect(() => numeric(1.001, "Berat")).toThrow(/dua angka desimal/);
    expect(() => numeric(0, "Berat", { positive: true })).toThrow(
      /lebih dari 0/,
    );
    expect(() => numeric(1e12 + 1, "Berat")).toThrow(/terlalu besar/);
  });

  it.each([
    ["zero seedlings", { jumlahBibit: 0 }, /lebih dari 0/],
    ["unknown supplier", { supplierId: "missing" }, /pemasok/],
    ["unknown pond", { pondId: "missing" }, /kolam/],
  ])("BND-03 rejects a new batch with %s", (_label, overrides, message) => {
    expect(() => apply(createSeed(), "NEW_BATCH", newBatch(overrides))).toThrow(
      message,
    );
  });

  it.each([
    ["feed quantity", "FEED", { jenis: "Pelet", kg: -1 }],
    ["feed cost", "FEED", { jenis: "Pelet", kg: 1, biaya: -1 }],
    ["mortality count", "MORTALITY", { ekor: -1 }],
    ["harvest weight", "HARVEST", { beratKg: -1 }],
    [
      "sale price",
      "SALE",
      { clientId: "client-1", beratKg: 50, hargaPerKg: -1, lunas: false },
    ],
    ["other cost", "SET_COST", { biayaLain: -1 }],
  ])(
    "BND-04 rejects negative %s without mutating state",
    (_label, action, data) => {
      const state = harvest(createSeed());
      const original = structuredClone(state);
      expect(() =>
        apply(state, action, {
          batchId: "batch-a",
          tanggal: todayJakarta(),
          ...data,
        }),
      ).toThrow(/tidak negatif|lebih dari 0/);
      expect(state).toEqual(original);
    },
  );

  it("BND-05 rejects blank feed types", () => {
    expect(() =>
      apply(createSeed(), "FEED", {
        batchId: "batch-a",
        tanggal: todayJakarta(),
        jenis: "   ",
        kg: 1,
      }),
    ).toThrow(/Jenis pakan wajib/);
  });

  it("BND-06 stores an omitted harvest fish count as null", () => {
    const state = harvest(createSeed());
    expect(state.harvests[0].ekor).toBeNull();
    expect(isValidState(state)).toBe(true);
  });

  it("BND-07 limits cumulative harvested fish after recorded deaths", () => {
    let state = apply(createSeed(), "HARVEST", {
      batchId: "batch-a",
      tanggal: todayJakarta(),
      beratKg: 100,
      ekor: 4900,
    }).state;
    // The seeded active batch has 5,000 fish and 45 recorded deaths.
    expect(() =>
      apply(state, "HARVEST", {
        batchId: "batch-a",
        tanggal: todayJakarta(),
        beratKg: 10,
        ekor: 56,
      }),
    ).toThrow(/melebihi sisa ikan/);
    state = apply(state, "HARVEST", {
      batchId: "batch-a",
      tanggal: todayJakarta(),
      beratKg: 10,
      ekor: 55,
    }).state;
    expect(batchSummary(state, state.batches[0]).harvested).toBe(110);
  });

  it("BND-08 excludes harvested fish from the available mortality count", () => {
    const state = apply(createSeed(), "HARVEST", {
      batchId: "batch-a",
      tanggal: todayJakarta(),
      beratKg: 100,
      ekor: 4955,
    }).state;
    expect(() =>
      apply(state, "MORTALITY", {
        batchId: "batch-a",
        tanggal: todayJakarta(),
        ekor: 1,
      }),
    ).toThrow(/melebihi sisa ikan/);
  });

  it("BND-09 accepts a sale exactly equal to the decimal harvest balance", () => {
    let state = harvest(createSeed(), 0.3);
    state = apply(state, "SALE", sale({ beratKg: 0.1 })).state;
    state = apply(state, "SALE", sale({ beratKg: 0.2 })).state;
    expect(batchSummary(state, state.batches[0]).unsold).toBe(0);
    expect(batchSummary(state, state.batches[0]).revenue).toBe(7500);
  });

  it.each([
    ["unknown client", { clientId: "missing" }, /klien/],
    ["non-boolean payment status", { lunas: "true" }, /status pembayaran/],
  ])("BND-10 rejects a sale with %s", (_label, overrides, message) => {
    expect(() => apply(harvest(createSeed()), "SALE", sale(overrides))).toThrow(
      message,
    );
  });

  it("BND-11 repeated payment settlement does not change revenue or other sales", () => {
    const state = apply(harvest(createSeed()), "SALE", sale()).state;
    const paid = apply(state, "MARK_PAID", { saleId: state.sales[0].id }).state;
    const paidAgain = apply(paid, "MARK_PAID", {
      saleId: state.sales[0].id,
    }).state;
    expect(paidAgain).toEqual(paid);
    expect(paidAgain.sales.slice(1)).toEqual(state.sales.slice(1));
    expect(batchSummary(paidAgain, paidAgain.batches[0]).revenue).toBe(1250000);
  });

  it.each([
    ["duplicate IDs", (state) => state.feedLogs.push({ ...state.feedLogs[0] })],
    [
      "missing client reference",
      (state) => {
        state.sales[0].clientId = "missing";
      },
    ],
    [
      "two active batches in one pond",
      (state) =>
        state.batches.push({
          ...state.batches[0],
          id: "duplicate-pond-batch",
          kode: "LL-999",
        }),
    ],
    [
      "log after batch closure",
      (state) => {
        state.harvests[0].tanggal = addDays(state.batches[1].tanggalSelesai, 1);
      },
    ],
  ])("BND-12 rejects persisted data containing %s", (_label, corrupt) => {
    const state = createSeed();
    corrupt(state);
    expect(isValidState(state)).toBe(false);
  });

  it("BND-13 defaults omitted owner feed cost to zero without changing the original state", () => {
    const state = createSeed();
    const original = structuredClone(state);
    const updated = apply(state, "FEED", {
      batchId: "batch-a",
      tanggal: todayJakarta(),
      jenis: "Pelet",
      kg: 2,
    }).state;
    expect(updated.feedLogs[0].biaya).toBe(0);
    expect(updated.feedLogs).toHaveLength(original.feedLogs.length + 1);
    expect(state).toEqual(original);
  });
});
