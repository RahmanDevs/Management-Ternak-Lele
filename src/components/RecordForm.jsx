import { useState } from "react";
import { Check, ClipboardList, Scale, ShoppingBag, Wheat } from "lucide-react";
import { useStore } from "../store/Store";
import { batchSummary } from "../lib/calc";
import { number, rupiah, todayJakarta } from "../lib/format";
import { EmptyState, ErrorBox, Field, OwnerOnly } from "./UI";

const config = {
  feed: {
    title: "Catat pemberian pakan",
    description: "Nutrisi yang terjaga, pertumbuhan yang terpantau.",
    action: "FEED",
    icon: Wheat,
    quantity: "Berat pakan (kg)",
    field: "kg",
    button: "Simpan Pakan",
    success: "Catatan pakan berhasil disimpan.",
  },
  mortality: {
    title: "Catat kematian ikan",
    description: "Catatan yang jujur membantu budidaya lebih baik.",
    action: "MORTALITY",
    icon: ClipboardList,
    quantity: "Jumlah kematian (ekor)",
    field: "ekor",
    button: "Simpan Kematian",
    success: "Catatan kematian berhasil disimpan.",
  },
  harvest: {
    title: "Catat hasil panen",
    description: "Panen sekaligus atau bertahap, semua tercatat.",
    action: "HARVEST",
    icon: Scale,
    quantity: "Berat panen (kg)",
    field: "beratKg",
    button: "Simpan Panen",
    success: "Hasil panen berhasil disimpan.",
  },
  sale: {
    title: "Catat penjualan",
    description: "Hubungkan hasil panen dengan pelanggan Anda.",
    action: "SALE",
    icon: ShoppingBag,
    quantity: "Berat jual (kg)",
    field: "beratKg",
    button: "Simpan Penjualan",
    success: "Penjualan berhasil disimpan.",
  },
};

export default function RecordForm({ kind, fixedBatch, initialBatchId }) {
  const { state, user, transact, notify } = useStore();
  const options = state.batches.filter((batch) => batch.status !== "selesai");
  const [selected, setSelected] = useState(
    options.some((item) => item.id === initialBatchId)
      ? initialBatchId
      : options[0]?.id || "",
  );
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const batch = fixedBatch || options.find((item) => item.id === selected);
  const settings = config[kind];
  const Icon = settings.icon;
  if (!batch || batch.status === "selesai")
    return (
      <section className="panel">
        <EmptyState
          title="Tidak ada batch berjalan"
          description="Minta Owner memulai batch baru sebelum menambahkan catatan."
        />
      </section>
    );
  if (["harvest", "sale"].includes(kind) && user.role !== "owner") return null;
  function submit(event) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      transact(settings.action, {
        ...data,
        batchId: batch.id,
        biaya:
          kind === "feed" && user.role === "owner"
            ? data.biaya || 0
            : undefined,
        ...(kind === "sale" ? { lunas: data.lunas === "true" } : {}),
      });
      event.currentTarget.reset();
      setQuantity("");
      setPrice("");
      notify(settings.success);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="panel form-panel record-form" onSubmit={submit}>
      <div className="record-form-heading">
        <span className={`record-icon ${kind}`}>
          <Icon size={23} />
        </span>
        <div>
          <h2>{settings.title}</h2>
          <p>{settings.description}</p>
        </div>
      </div>
      <ErrorBox message={error} />
      {kind === "sale" && (
        <div className="notice notice-info">
          Sisa panen tersedia:{" "}
          <strong>{number(batchSummary(state, batch).unsold)} kg</strong>.
          Penjualan melebihi sisa panen akan ditolak.
        </div>
      )}
      <div className="form-stack">
        {!fixedBatch && (
          <Field label="Batch / Kolam">
            <select
              name="batchId"
              value={selected}
              onChange={(event) => {
                setSelected(event.target.value);
                setError("");
              }}
            >
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {state.ponds.find((pond) => pond.id === item.pondId)?.nama} ·{" "}
                  {item.kode}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Tanggal">
          <input
            name="tanggal"
            type="date"
            defaultValue={todayJakarta()}
            min={batch.tanggalTebar}
            max={todayJakarta()}
            required
          />
        </Field>
        {kind === "feed" && (
          <Field label="Jenis pakan">
            <input
              name="jenis"
              list="feed-types"
              maxLength={100}
              placeholder="Contoh: Pelet 781-2"
              required
            />
          </Field>
        )}
        {kind === "feed" && (
          <datalist id="feed-types">
            <option value="Pelet PF-800" />
            <option value="Pelet 781-1" />
            <option value="Pelet 781-2" />
            <option value="Pelet 781-3" />
          </datalist>
        )}
        {kind === "sale" && (
          <Field label="Klien">
            <select name="clientId" defaultValue="" required>
              <option value="" disabled>
                Pilih klien
              </option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nama}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={settings.quantity}>
          <input
            name={settings.field}
            type="number"
            inputMode={kind === "mortality" ? "numeric" : "decimal"}
            min={["sale", "harvest"].includes(kind) ? "0.01" : "0"}
            step={kind === "mortality" ? "1" : "0.01"}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={kind === "mortality" ? "Contoh: 5" : "Contoh: 15"}
            required
          />
        </Field>
        {kind === "feed" && (
          <OwnerOnly>
            <Field
              label="Biaya pakan (Rp)"
              optional
              hint="Kosongkan jika belum diketahui; dihitung sebagai 0."
            >
              <input
                name="biaya"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
              />
            </Field>
          </OwnerOnly>
        )}
        {kind === "mortality" && (
          <Field label="Catatan" optional>
            <textarea
              name="catatan"
              rows={3}
              maxLength={1000}
              placeholder="Kondisi ikan atau hal yang perlu diperhatikan..."
            />
          </Field>
        )}
        {kind === "harvest" && (
          <Field label="Jumlah ikan (ekor)" optional>
            <input
              name="ekor"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="Kosongkan jika tidak dihitung"
            />
          </Field>
        )}
        {kind === "sale" && (
          <>
            <Field label="Harga per kg (Rp)">
              <input
                name="hargaPerKg"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Contoh: 25000"
                required
              />
            </Field>
            <Field label="Status pembayaran">
              <select name="lunas" defaultValue="false">
                <option value="false">Belum Lunas</option>
                <option value="true">Lunas</option>
              </select>
            </Field>
            <div className="sale-total">
              <span>Total penjualan</span>
              <strong>
                {rupiah((Number(quantity) || 0) * (Number(price) || 0))}
              </strong>
            </div>
          </>
        )}
      </div>
      <div className="form-actions">
        <span className="form-autosave">
          Tersimpan setelah Anda menekan simpan.
        </span>
        <button className="btn btn-primary" type="submit">
          <Check size={18} />
          {settings.button}
        </button>
      </div>
    </form>
  );
}
