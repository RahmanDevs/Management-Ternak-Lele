export function todayJakarta(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export const number = (value, decimals = 2) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: decimals,
  }).format(value);

export const rupiah = (value) => `Rp ${number(Math.round(value), 0)}`;
export const formatDate = (date) =>
  date ? date.split("-").reverse().join("/") : "—";
export const longDate = (date = todayJakarta()) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
