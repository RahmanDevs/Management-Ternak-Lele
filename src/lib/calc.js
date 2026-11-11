import { addDays, todayJakarta } from "./format";

export const sum = (items, selector) =>
  items.reduce((total, item) => total + selector(item), 0);
export const roundKg = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
};
export const batchAge = (tanggalTebar, today = todayJakarta()) =>
  Math.max(
    0,
    Math.round(
      (Date.parse(`${today}T00:00:00Z`) -
        Date.parse(`${tanggalTebar}T00:00:00Z`)) /
        86400000,
    ),
  );
export const expectedHarvest = (tanggalTebar) => addDays(tanggalTebar, 90);
export const daysToHarvest = (tanggalTebar, today = todayJakarta()) =>
  Math.round(
    (Date.parse(`${expectedHarvest(tanggalTebar)}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
export const batchLogs = (state, collection, batch) =>
  state[collection].filter((item) => item.batchId === batch.id);
export const mortalityRate = (batch, logs) =>
  batch.jumlahBibit
    ? (sum(logs, (log) => log.ekor) / batch.jumlahBibit) * 100
    : 0;
export const totalFeedCost = (logs) => sum(logs, (log) => log.biaya);
export const totalCost = (batch, logs) =>
  batch.hargaBibitTotal + totalFeedCost(logs) + batch.biayaLain;
export const revenue = (sales) =>
  sum(sales, (sale) => Math.round(sale.beratKg * sale.hargaPerKg));
export const outstanding = (sales) =>
  revenue(sales.filter((sale) => !sale.lunas));
export const grossProfit = (batch, feedLogs, sales) =>
  revenue(sales) - totalCost(batch, feedLogs);
export const margin = (batch, feedLogs, sales) =>
  revenue(sales) === 0
    ? null
    : (grossProfit(batch, feedLogs, sales) / revenue(sales)) * 100;
export const unsoldKg = (harvests, sales) =>
  roundKg(
    sum(harvests, (item) => item.beratKg) - sum(sales, (item) => item.beratKg),
  );

export function batchSummary(state, batch) {
  const feeds = batchLogs(state, "feedLogs", batch);
  const deaths = batchLogs(state, "mortalityLogs", batch);
  const harvests = batchLogs(state, "harvests", batch);
  const sales = batchLogs(state, "sales", batch);
  return {
    feedKg: roundKg(sum(feeds, (item) => item.kg)),
    feedCost: totalFeedCost(feeds),
    deaths: sum(deaths, (item) => item.ekor),
    mortality: mortalityRate(batch, deaths),
    harvested: roundKg(sum(harvests, (item) => item.beratKg)),
    sold: roundKg(sum(sales, (item) => item.beratKg)),
    unsold: unsoldKg(harvests, sales),
    cost: totalCost(batch, feeds),
    revenue: revenue(sales),
    outstanding: outstanding(sales),
    profit: grossProfit(batch, feeds, sales),
    margin: margin(batch, feeds, sales),
  };
}

export const activeBatchForPond = (state, pondId) =>
  state.batches.find(
    (batch) => batch.pondId === pondId && batch.status !== "selesai",
  );

export function recentActivity(state) {
  return [
    ...state.feedLogs.map((log) => ({
      ...log,
      kind: "feed",
      title: "Pemberian pakan",
      amount: log.kg,
      unit: "kg",
      detail: log.jenis,
    })),
    ...state.mortalityLogs.map((log) => ({
      ...log,
      kind: "mortality",
      title: "Catatan kematian",
      amount: log.ekor,
      unit: "ekor",
      detail: log.catatan,
    })),
  ].sort(
    (a, b) =>
      b.tanggal.localeCompare(a.tanggal) ||
      (b.createdAt || 0) - (a.createdAt || 0),
  );
}
