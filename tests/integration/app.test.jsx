import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { loadState, SESSION_KEY } from "../../src/store/persistence";
import { expectedHarvest } from "../../src/lib/calc";
import { formatDate, todayJakarta } from "../../src/lib/format";
import { fill, main, openApp } from "../helpers/renderApp";

describe("Login and access control", () => {
  it("AUTH-01 logs in via the Owner demo button", async () => {
    openApp();
    await userEvent.click(
      screen.getByRole("button", { name: /Masuk sebagai Owner/ }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Budidaya terpantau, hati tenang.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Pendapatan")).toBeInTheDocument();
  });
  it("AUTH-02 logs in via the Worker demo button without financial data", async () => {
    openApp();
    await userEvent.click(
      screen.getByRole("button", { name: /Masuk sebagai Farm Worker/ }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Hari baik dimulai dari kolam.",
      }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /Rp\s|Laba Kotor|Total Pendapatan|Biaya pakan/,
    );
  });
  it("AUTH-03 rejects incorrect credentials and accepts a valid password", async () => {
    openApp();
    fill("Username", "owner");
    fill("Password", "incorrect");
    await userEvent.click(
      screen.getByRole("button", { name: "Masuk ke Leleku" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Username atau password tidak cocok",
    );
    fill("Password", "owner123");
    await userEvent.click(
      screen.getByRole("button", { name: "Masuk ke Leleku" }),
    );
    expect(await screen.findByText("Total Pendapatan")).toBeInTheDocument();
  });
  it.each([
    "/dashboard",
    "/batches",
    "/batches/new",
    "/batches/batch-b",
    "/batches/batch-b/sale",
    "/batches/batch-a/feed",
  ])("AUTH-04 guards owner route %s from workers", async (route) => {
    openApp(route, "worker");
    expect(
      await screen.findByRole("heading", {
        name: "Hari baik dimulai dari kolam.",
      }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /Rp\s|Laba Kotor|Total Pendapatan/,
    );
  });
  it.each(["/worker", "/feed", "/mortality", "/history"])(
    "AUTH-05 shows no financial amounts on worker page %s",
    (route) => {
      openApp(route, "worker");
      expect(document.body.textContent).not.toMatch(
        /Rp\s|Laba Kotor|Biaya pakan|Pendapatan/,
      );
    },
  );
  it("AUTH-06 redirects unauthenticated deep links to login", async () => {
    openApp("/batches/batch-b/sale");
    expect(
      await screen.findByRole("button", { name: /Masuk sebagai Owner/ }),
    ).toBeInTheDocument();
  });
  it("AUTH-07 logs out and clears the stored session", async () => {
    openApp("/dashboard", "owner");
    await userEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);
    expect(
      await screen.findByRole("button", { name: /Masuk sebagai Owner/ }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe("Daily recording and history", () => {
  it("DAY-01 records worker feed without seeing or setting a cost", async () => {
    openApp("/feed", "worker");
    expect(screen.queryByLabelText(/Biaya pakan/)).not.toBeInTheDocument();
    fill("Jenis pakan", "Pelet harian");
    fill("Berat pakan (kg)", "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Simpan Pakan" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Catatan pakan berhasil disimpan",
    );
    expect(loadState().state.feedLogs[0]).toMatchObject({
      jenis: "Pelet harian",
      kg: 12.5,
      biaya: 0,
    });
    expect(screen.getByText("Pelet harian")).toBeInTheDocument();
  });
  it("DAY-02 records a worker mortality note and displays its history", async () => {
    openApp("/mortality", "worker");
    fill("Jumlah kematian (ekor)", 3);
    fill(/Catatan/, "Pengecekan sore selesai");
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan Kematian" }),
    );
    expect(loadState().state.mortalityLogs[0]).toMatchObject({
      ekor: 3,
      catatan: "Pengecekan sore selesai",
    });
    expect(screen.getByText("Pengecekan sore selesai")).toBeInTheDocument();
  });
  it("DAY-03 filters daily history by kind and batch", async () => {
    openApp("/history", "worker");
    await userEvent.selectOptions(
      screen.getByLabelText("Jenis catatan"),
      "mortality",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Batch / Kolam"),
      "batch-a",
    );
    expect(main().getAllByText("Catatan kematian")).toHaveLength(3);
    expect(main().queryByText("Pemberian pakan")).not.toBeInTheDocument();
  });
});

describe("Owner showcase workflow", () => {
  it("FLOW-01 rejects an occupied pond then starts a batch in Kolam C", async () => {
    openApp("/batches/new?pond=pond-a", "owner");
    await userEvent.selectOptions(
      screen.getByLabelText("Pemasok bibit"),
      "supplier-1",
    );
    fill("Jumlah bibit (ekor)", 1000);
    fill("Total biaya bibit (Rp)", 300000);
    expect(
      screen.getByText(formatDate(expectedHarvest(todayJakarta()))),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mulai Batch" }));
    expect(screen.getByRole("alert")).toHaveTextContent("masih memiliki batch");
    await userEvent.click(screen.getByRole("radio", { name: /Kolam C/ }));
    await userEvent.click(screen.getByRole("button", { name: "Mulai Batch" }));
    expect(
      await screen.findByRole("heading", { name: /LL-003/ }),
    ).toBeInTheDocument();
    expect(loadState().state.batches[0].pondId).toBe("pond-c");
  });
  it("FLOW-02 records harvest and two sales, rejects overselling, and closes with warnings", async () => {
    openApp("/batches/batch-a/harvest", "owner");
    fill("Berat panen (kg)", 100);
    await userEvent.click(screen.getByRole("button", { name: "Simpan Panen" }));
    expect(loadState().state.batches[0].status).toBe("panen");
    await userEvent.click(main().getByRole("link", { name: "Penjualan" }));
    await userEvent.selectOptions(screen.getByLabelText("Klien"), "client-1");
    fill("Berat jual (kg)", 101);
    fill("Harga per kg (Rp)", 25000);
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan Penjualan" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("melebihi sisa panen");
    fill("Berat jual (kg)", 40);
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan Penjualan" }),
    );
    await userEvent.selectOptions(screen.getByLabelText("Klien"), "client-2");
    fill("Berat jual (kg)", 50);
    fill("Harga per kg (Rp)", 24000);
    await userEvent.selectOptions(
      screen.getByLabelText("Status pembayaran"),
      "true",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan Penjualan" }),
    );
    expect(
      loadState().state.sales.filter((entry) => entry.batchId === "batch-a"),
    ).toHaveLength(2);
    await userEvent.click(main().getByRole("link", { name: "Ringkasan" }));
    expect(main().getAllByText("Rp 2.200.000").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "Tutup Batch" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(
      dialog.getByText("10 kg hasil panen belum terjual."),
    ).toBeInTheDocument();
    expect(
      dialog.getByText("Masih ada penjualan dengan status Belum Lunas."),
    ).toBeInTheDocument();
    await userEvent.click(
      dialog.getByRole("button", { name: "Ya, tutup batch" }),
    );
    expect(loadState().state.batches[0].status).toBe("selesai");
    expect(
      screen.queryByRole("button", { name: "Tutup Batch" }),
    ).not.toBeInTheDocument();
  });
  it("FLOW-03 requires reset confirmation and restores seeded data", async () => {
    openApp("/dashboard", "owner");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Reset Data Demo" })[0],
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Reset Data Demo" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ya, reset data" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Data demo berhasil",
      ),
    );
    expect(loadState().state.batches).toHaveLength(2);
  });
});
