import { describe, expect, it, vi } from "vitest";
import { createSeed } from "../../src/data/seed";
import {
  activeBatchForPond,
  batchAge,
  batchSummary,
  expectedHarvest,
  margin,
  unsoldKg,
} from "../../src/lib/calc";
import {
  addDays,
  formatDate,
  rupiah,
  todayJakarta,
} from "../../src/lib/format";
import { closureWarnings, numeric } from "../../src/lib/validate";
import {
  isValidState,
  loadState,
  saveState,
  STORAGE_KEY,
} from "../../src/store/persistence";
import { apply, harvest, newBatch, sale } from "../helpers/fixtures";

describe("Calendar and display rules", () => {
  it("CAL-01 uses Jakarta calendar dates at the UTC day boundary", () => {
    expect(todayJakarta(new Date("2026-11-10T18:00:00Z"))).toBe("2026-11-11");
  });
  it.each([
    ["2026-01-01", "2026-04-01"],
    ["2024-01-01", "2024-03-31"],
    ["2026-11-11", "2027-02-09"],
    ["2024-02-29", "2024-05-29"],
  ])("CAL-02 adds exactly 90 days to %s", (start, expected) => {
    expect(expectedHarvest(start)).toBe(expected);
  });
  it("CAL-03 calculates age in complete calendar days", () => {
    expect(batchAge("2026-09-12", "2026-11-11")).toBe(60);
  });
  it("CAL-04 formats IDR integers and Indonesian dates", () => {
    expect(rupiah(1250000.4)).toBe("Rp 1.250.000");
    expect(formatDate("2026-11-11")).toBe("11/11/2026");
  });
});

describe("Seed and financial calculations", () => {
  it("FIN-01 seeds three ponds and the required demo lifecycle states", () => {
    const state = createSeed();
    expect(isValidState(state)).toBe(true);
    expect(state.ponds).toHaveLength(3);
    expect(batchAge(state.batches[0].tanggalTebar)).toBe(60);
    expect(activeBatchForPond(state, "pond-a").status).toBe("aktif");
    expect(activeBatchForPond(state, "pond-b")).toBeUndefined();
    expect(activeBatchForPond(state, "pond-c")).toBeUndefined();
  });
  it("FIN-02 matches the manually calculated completed batch profit", () => {
    const state = createSeed();
    const summary = batchSummary(state, state.batches[1]);
    expect(summary).toMatchObject({
      cost: 7100000,
      feedCost: 5400000,
      revenue: 13387500,
      profit: 6287500,
      harvested: 547.5,
      sold: 547.5,
      outstanding: 0,
      unsold: 0,
    });
    expect(summary.mortality).toBeCloseTo((120 / 4500) * 100);
    expect(summary.margin).toBeCloseTo((6287500 / 13387500) * 100);
  });
  it("FIN-03 hides margin when revenue is zero", () => {
    const state = createSeed();
    expect(margin(state.batches[0], state.feedLogs, [])).toBeNull();
    expect(batchSummary(state, state.batches[0]).profit).toBe(-3370000);
  });
  it("FIN-04 avoids floating-point residual kilograms", () => {
    expect(
      unsoldKg([{ beratKg: 0.3 }], [{ beratKg: 0.1 }, { beratKg: 0.2 }]),
    ).toBe(0);
  });
});

describe("Batch lifecycle invariants", () => {
  it("BAT-01 rejects a second active batch in an occupied pond", () => {
    const state = createSeed();
    expect(() =>
      apply(state, "NEW_BATCH", newBatch({ pondId: "pond-a" })),
    ).toThrow(/masih memiliki batch/);
    expect(state.batches).toHaveLength(2);
  });
  it("BAT-02 rejects a batch in a pond with harvest in progress", () => {
    expect(() =>
      apply(harvest(createSeed()), "NEW_BATCH", newBatch({ pondId: "pond-a" })),
    ).toThrow(/masih memiliki batch/);
  });
  it("BAT-03 starts a uniquely coded batch in an available pond", () => {
    const result = apply(createSeed(), "NEW_BATCH", newBatch());
    expect(result.state.batches[0]).toMatchObject({
      id: result.id,
      kode: "LL-003",
      status: "aktif",
      farmId: "farm-demo",
    });
  });
  it("BAT-04 allows reuse of a pond with only completed history", () => {
    expect(
      apply(createSeed(), "NEW_BATCH", newBatch({ pondId: "pond-b" })).state
        .batches,
    ).toHaveLength(3);
  });
  it("BAT-05 transitions to harvest and allows partial harvests", () => {
    const state = harvest(harvest(createSeed(), 30), 70);
    expect(state.batches[0].status).toBe("panen");
    expect(batchSummary(state, state.batches[0]).harvested).toBe(100);
  });
  it("BAT-06 warns before closure and releases the pond after confirmation", () => {
    const state = apply(
      harvest(createSeed()),
      "SALE",
      sale({ beratKg: 20 }),
    ).state;
    expect(closureWarnings(state, state.batches[0])).toHaveLength(2);
    expect(() => apply(state, "CLOSE_BATCH", { batchId: "batch-a" })).toThrow(
      /Konfirmasi/,
    );
    const closed = apply(state, "CLOSE_BATCH", {
      batchId: "batch-a",
      confirmed: true,
    }).state;
    expect(closed.batches[0].status).toBe("selesai");
    expect(activeBatchForPond(closed, "pond-a")).toBeUndefined();
    expect(
      apply(closed, "NEW_BATCH", newBatch({ pondId: "pond-a" })).state
        .batches[0].status,
    ).toBe("aktif");
  });
  it.each(["FEED", "MORTALITY", "HARVEST", "SALE", "SET_COST"])(
    "BAT-07 blocks %s mutations on completed batches",
    (type) => {
      expect(() =>
        apply(createSeed(), type, {
          batchId: "batch-b",
          tanggal: todayJakarta(),
        }),
      ).toThrow(/sudah selesai/);
    },
  );
  it("BAT-08 updates a single other-cost total rather than accumulating it", () => {
    const state = apply(createSeed(), "SET_COST", {
      batchId: "batch-a",
      biayaLain: 100000,
    }).state;
    expect(state.batches[0].biayaLain).toBe(100000);
  });
});

describe("Sales and payments", () => {
  it("SAL-01 rejects sale weight exceeding total harvest", () => {
    expect(() =>
      apply(harvest(createSeed()), "SALE", sale({ beratKg: 100.01 })),
    ).toThrow(/melebihi sisa panen/);
  });
  it("SAL-02 rejects sales before any harvest", () => {
    expect(() => apply(createSeed(), "SALE", sale())).toThrow(
      /melebihi sisa panen/,
    );
  });
  it("SAL-03 supports two clients and prices, including unpaid revenue", () => {
    let state = harvest(createSeed());
    state = apply(
      state,
      "SALE",
      sale({ beratKg: 40, hargaPerKg: 24000, lunas: true }),
    ).state;
    state = apply(
      state,
      "SALE",
      sale({ clientId: "client-2", beratKg: 60, hargaPerKg: 25000 }),
    ).state;
    expect(batchSummary(state, state.batches[0])).toMatchObject({
      revenue: 2460000,
      outstanding: 1500000,
      unsold: 0,
    });
    expect(() => apply(state, "SALE", sale({ beratKg: 0.01 }))).toThrow(
      /melebihi/,
    );
  });
  it("SAL-04 settles a receivable after closure without changing revenue", () => {
    let state = apply(
      harvest(createSeed()),
      "SALE",
      sale({ beratKg: 100 }),
    ).state;
    const id = state.sales[0].id;
    state = apply(state, "CLOSE_BATCH", {
      batchId: "batch-a",
      confirmed: true,
    }).state;
    state = apply(state, "MARK_PAID", { saleId: id }).state;
    expect(batchSummary(state, state.batches[0]).outstanding).toBe(0);
    expect(batchSummary(state, state.batches[0]).revenue).toBe(2500000);
  });
  it("SAL-05 rejects a sale dated before its harvest", () => {
    expect(() =>
      apply(
        harvest(createSeed()),
        "SALE",
        sale({ tanggal: addDays(todayJakarta(), -1) }),
      ),
    ).toThrow(/tanggal/);
  });
  it("SAL-06 prevents backdated sales from consuming stock required later", () => {
    let state = apply(createSeed(), "HARVEST", {
      batchId: "batch-a",
      tanggal: addDays(todayJakarta(), -10),
      beratKg: 100,
    }).state;
    state = apply(
      state,
      "SALE",
      sale({ tanggal: addDays(todayJakarta(), -8), beratKg: 100 }),
    ).state;
    state = harvest(state, 100);
    expect(() =>
      apply(
        state,
        "SALE",
        sale({ tanggal: addDays(todayJakarta(), -9), beratKg: 100 }),
      ),
    ).toThrow(/tanggal/);
  });
});

describe("Input validation and role enforcement", () => {
  it.each([-1, NaN, Infinity, "", null, "not-a-number"])(
    "VAL-01 rejects invalid numeric input: %s",
    (value) => {
      expect(() => numeric(value, "Berat")).toThrow();
    },
  );
  it("VAL-02 rejects fractional fish and fractional rupiah", () => {
    expect(() => numeric(1.5, "Ekor", { integer: true })).toThrow(/bulat/);
    expect(() =>
      apply(createSeed(), "NEW_BATCH", newBatch({ hargaBibitTotal: 0.5 })),
    ).toThrow(/bulat/);
  });
  it("VAL-03 rejects invalid calendar dates and dates outside the batch period", () => {
    const state = createSeed();
    const payload = { batchId: "batch-a", jenis: "Pelet", kg: 2 };
    expect(() =>
      apply(state, "FEED", {
        ...payload,
        tanggal: addDays(state.batches[0].tanggalTebar, -1),
      }),
    ).toThrow(/sebelum/);
    expect(() =>
      apply(state, "FEED", { ...payload, tanggal: addDays(todayJakarta(), 1) }),
    ).toThrow(/setelah hari ini/);
    expect(() =>
      apply(state, "NEW_BATCH", newBatch({ tanggalTebar: "2025-02-30" })),
    ).toThrow(/tidak valid/);
  });
  it("VAL-04 rejects cumulative deaths exceeding available fish", () => {
    expect(() =>
      apply(createSeed(), "MORTALITY", {
        batchId: "batch-a",
        tanggal: todayJakarta(),
        ekor: 5000,
      }),
    ).toThrow(/melebihi sisa ikan/);
  });
  it.each([
    "NEW_BATCH",
    "HARVEST",
    "SALE",
    "CLOSE_BATCH",
    "SET_COST",
    "MARK_PAID",
    "RESET",
  ])("VAL-05 denies worker action %s", (type) => {
    expect(() => apply(createSeed(), type, {}, "worker")).toThrow(
      /hanya dapat dilakukan oleh Owner/,
    );
  });
  it("VAL-06 allows worker daily records but rejects worker financial input", () => {
    let state = apply(
      createSeed(),
      "FEED",
      { batchId: "batch-a", tanggal: todayJakarta(), jenis: "Pelet", kg: 7.5 },
      "worker",
    ).state;
    expect(state.feedLogs[0].biaya).toBe(0);
    state = apply(
      state,
      "MORTALITY",
      {
        batchId: "batch-a",
        tanggal: todayJakarta(),
        ekor: 0,
        catatan: "Kondisi baik",
      },
      "worker",
    ).state;
    expect(state.mortalityLogs[0].ekor).toBe(0);
    expect(() =>
      apply(
        state,
        "FEED",
        {
          batchId: "batch-a",
          tanggal: todayJakarta(),
          jenis: "Pelet",
          kg: 2,
          biaya: 5000,
        },
        "worker",
      ),
    ).toThrow(/Owner/);
  });
  it("VAL-07 requires a valid session for mutations", () => {
    expect(() => apply(createSeed(), "FEED", {}, null)).toThrow(/masuk/);
  });
});

describe("Local persistence and recovery", () => {
  it("STO-01 persists a changed state and restores it after reloading", () => {
    const state = apply(createSeed(), "NEW_BATCH", newBatch()).state;
    expect(saveState(state)).toBe(true);
    expect(loadState().state).toEqual(state);
  });
  it("STO-02 handles malformed JSON, invalid state, and unsupported versions", () => {
    for (const raw of [
      "invalid json",
      JSON.stringify({ version: 1, data: { batches: [] } }),
      JSON.stringify({ version: 99, data: createSeed() }),
    ]) {
      localStorage.setItem(STORAGE_KEY, raw);
      expect(loadState().state.ponds).toHaveLength(3);
      expect(loadState().warning).not.toBe("");
    }
  });
  it("STO-03 falls back to memory when storage is blocked or full", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("Blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("Quota");
      }),
    };
    expect(loadState(storage).state.batches).toHaveLength(2);
    expect(saveState(createSeed(), storage)).toBe(false);
  });
  it("STO-04 resets changed data without removing unrelated browser storage", () => {
    localStorage.setItem("unrelated", "keep");
    const state = apply(
      apply(createSeed(), "NEW_BATCH", newBatch()).state,
      "RESET",
    ).state;
    saveState(state);
    expect(loadState().state.batches).toHaveLength(2);
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
