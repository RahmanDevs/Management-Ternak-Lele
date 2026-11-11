import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeed } from "../../src/data/seed";
import { batchSummary } from "../../src/lib/calc";
import { loadState, SESSION_KEY } from "../../src/store/persistence";
import { apply, harvest, sale } from "../helpers/fixtures";
import { fill, main, openApp } from "../helpers/renderApp";

describe("UI persistence and recovery regressions", () => {
  it("UI-01 records owner feed cost and updates the batch total", async () => {
    openApp("/feed", "owner");
    fill("Jenis pakan", "Pelet premium");
    fill("Berat pakan (kg)", 10);
    fill(/Biaya pakan \(Rp\)/, 120000);
    await userEvent.click(screen.getByRole("button", { name: "Simpan Pakan" }));
    const state = loadState().state;
    expect(state.feedLogs[0]).toMatchObject({ kg: 10, biaya: 120000 });
    expect(batchSummary(state, state.batches[0]).cost).toBe(3490000);
  });

  it("UI-02 restores the session and recorded data after remounting the app", async () => {
    const view = openApp("/feed", "worker");
    fill("Jenis pakan", "Pelet untuk pengujian persistensi");
    fill("Berat pakan (kg)", 4);
    await userEvent.click(screen.getByRole("button", { name: "Simpan Pakan" }));
    view.unmount();
    openApp("/history");
    expect(
      screen.getByText("Pelet untuk pengujian persistensi"),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe("worker");
    expect(document.body.textContent).not.toMatch(/Rp\s/);
  });

  it("UI-03 shows a recovery link for an unknown batch", () => {
    openApp("/batches/missing-batch", "owner");
    expect(
      screen.getByRole("heading", { name: "Batch tidak ditemukan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kembali ke daftar batch" }),
    ).toHaveAttribute("href", "/batches");
  });

  it("UI-04 shows an empty state when workers have no active batch", () => {
    const state = apply(createSeed(), "CLOSE_BATCH", {
      batchId: "batch-a",
      confirmed: true,
    }).state;
    openApp("/feed", "worker", state);
    expect(
      screen.getByRole("heading", { name: "Tidak ada batch berjalan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Simpan Pakan" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["feed", "Simpan Pakan"],
    ["mortality", "Simpan Kematian"],
    ["harvest", "Simpan Panen"],
    ["sale", "Simpan Penjualan"],
  ])("UI-05 keeps completed batch tab %s read-only", (tab, submitLabel) => {
    openApp(`/batches/batch-b/${tab}`, "owner");
    expect(screen.getByText(/Catatan bersifat baca-saja/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: submitLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tutup Batch" }),
    ).not.toBeInTheDocument();
  });

  it("UI-06 confirms settlement after closure and preserves revenue", async () => {
    let state = apply(harvest(createSeed()), "SALE", sale()).state;
    state = apply(state, "CLOSE_BATCH", {
      batchId: "batch-a",
      confirmed: true,
    }).state;
    openApp("/batches/batch-a/sale", "owner", state);
    await userEvent.click(screen.getByRole("button", { name: "Tandai Lunas" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Batal" }),
    );
    expect(loadState().state.sales[0].lunas).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Tandai Lunas" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Ya, sudah lunas",
      }),
    );
    const updated = loadState().state;
    expect(updated.sales[0].lunas).toBe(true);
    expect(batchSummary(updated, updated.batches[0])).toMatchObject({
      revenue: 1250000,
      outstanding: 0,
    });
    expect(
      screen.queryByRole("button", { name: "Tandai Lunas" }),
    ).not.toBeInTheDocument();
  });

  it("UI-07 updates other costs and refreshes the displayed total", async () => {
    openApp("/batches/batch-a", "owner");
    fill("Total biaya lain (Rp)", 100000);
    await userEvent.click(
      screen.getByRole("button", { name: "Perbarui Biaya" }),
    );
    expect(loadState().state.batches[0].biayaLain).toBe(100000);
    expect(main().getAllByText("Rp 3.220.000").length).toBeGreaterThan(0);
  });

  it("UI-08 warns about blocked storage while allowing in-memory recording", async () => {
    sessionStorage.setItem(SESSION_KEY, "worker");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    });
    openApp("/feed");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Penyimpanan lokal tidak tersedia",
    );
    fill("Jenis pakan", "Pelet hanya di memori");
    fill("Berat pakan (kg)", 1);
    await userEvent.click(screen.getByRole("button", { name: "Simpan Pakan" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Catatan pakan berhasil disimpan",
    );
    expect(screen.getByText("Pelet hanya di memori")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Jangan muat ulang");
  });

  it("UI-09 leaves the batch active when closure is canceled", async () => {
    openApp("/batches/batch-a", "owner");
    await userEvent.click(screen.getByRole("button", { name: "Tutup Batch" }));
    expect(
      screen.getByText("Batch ini belum memiliki catatan panen."),
    ).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Batal" }),
    );
    expect(loadState().state.batches[0].status).toBe("aktif");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("UI-10 toggles password visibility without losing the entered value", async () => {
    openApp();
    fill("Password", "example-password");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Tampilkan password" }),
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Password")).toHaveValue("example-password");
    await userEvent.click(
      screen.getByRole("button", { name: "Sembunyikan password" }),
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });
});
