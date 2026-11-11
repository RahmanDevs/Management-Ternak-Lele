import { addDays, todayJakarta } from "../lib/format";

export const demoUsers = [
  {
    id: "owner",
    username: "owner",
    password: "owner123",
    role: "owner",
    nama: "Pemilik Farm",
  },
  {
    id: "worker",
    username: "worker",
    password: "worker123",
    role: "worker",
    nama: "Farm Worker",
  },
];

export function createSeed(today = todayJakarta()) {
  const ago = (days) => addDays(today, -days);
  return {
    farm: { id: "farm-demo", nama: "Farm Demo" },
    ponds: ["A", "B", "C"].map((letter) => ({
      id: `pond-${letter.toLowerCase()}`,
      farmId: "farm-demo",
      nama: `Kolam ${letter}`,
    })),
    suppliers: [
      { id: "supplier-1", nama: "Mina Sejahtera" },
      { id: "supplier-2", nama: "Bibit Berkah" },
      { id: "supplier-3", nama: "Sumber Lele Nusantara" },
    ],
    clients: [
      { id: "client-1", nama: "Warung Pecel Lele Pak Hadi" },
      { id: "client-2", nama: "Pasar Segar Nusantara" },
      { id: "client-3", nama: "Resto Dapur Kampung" },
    ],
    batches: [
      {
        id: "batch-a",
        kode: "LL-002",
        farmId: "farm-demo",
        pondId: "pond-a",
        supplierId: "supplier-1",
        tanggalTebar: ago(60),
        jumlahBibit: 5000,
        hargaBibitTotal: 1500000,
        biayaLain: 250000,
        status: "aktif",
        tanggalSelesai: null,
      },
      {
        id: "batch-b",
        kode: "LL-001",
        farmId: "farm-demo",
        pondId: "pond-b",
        supplierId: "supplier-2",
        tanggalTebar: ago(120),
        jumlahBibit: 4500,
        hargaBibitTotal: 1350000,
        biayaLain: 350000,
        status: "selesai",
        tanggalSelesai: ago(27),
      },
    ],
    feedLogs: [
      ...[55, 48, 41, 34, 27, 20, 13, 6, 2, 0].map((days, index) => ({
        id: `feed-a-${index}`,
        batchId: "batch-a",
        tanggal: ago(days),
        jenis: index < 3 ? "Pelet PF-800" : "Pelet 781-2",
        kg: index < 3 ? 10 : 15,
        biaya: (index < 3 ? 10 : 15) * 12000,
      })),
      ...[110, 95, 80, 65, 50, 35].map((days, index) => ({
        id: `feed-b-${index}`,
        batchId: "batch-b",
        tanggal: ago(days),
        jenis: "Pelet 781-2",
        kg: 75,
        biaya: 900000,
      })),
    ],
    mortalityLogs: [
      {
        id: "death-a-1",
        batchId: "batch-a",
        tanggal: ago(50),
        ekor: 25,
        catatan: "Adaptasi setelah penebaran bibit.",
      },
      {
        id: "death-a-2",
        batchId: "batch-a",
        tanggal: ago(30),
        ekor: 12,
        catatan: "Pengecekan rutin pagi hari.",
      },
      {
        id: "death-a-3",
        batchId: "batch-a",
        tanggal: ago(2),
        ekor: 8,
        catatan: "Sudah dibersihkan dari kolam.",
      },
      {
        id: "death-b-1",
        batchId: "batch-b",
        tanggal: ago(100),
        ekor: 75,
        catatan: "Adaptasi bibit.",
      },
      {
        id: "death-b-2",
        batchId: "batch-b",
        tanggal: ago(55),
        ekor: 45,
        catatan: "Catatan pemeriksaan harian.",
      },
    ],
    harvests: [
      {
        id: "harvest-b-1",
        batchId: "batch-b",
        tanggal: ago(30),
        beratKg: 300,
        ekor: 2400,
      },
      {
        id: "harvest-b-2",
        batchId: "batch-b",
        tanggal: ago(28),
        beratKg: 247.5,
        ekor: 1980,
      },
    ],
    sales: [
      {
        id: "sale-b-1",
        batchId: "batch-b",
        clientId: "client-1",
        tanggal: ago(30),
        beratKg: 300,
        hargaPerKg: 24000,
        lunas: true,
      },
      {
        id: "sale-b-2",
        batchId: "batch-b",
        clientId: "client-2",
        tanggal: ago(28),
        beratKg: 247.5,
        hargaPerKg: 25000,
        lunas: true,
      },
    ],
  };
}
