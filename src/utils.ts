import type { DB, EntityName } from "./types";

export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const numberWords = (n: number) =>
  n >= 100000
    ? "Rupees " + Math.floor(n / 100000) + " lakh " + Math.round((n % 100000) / 1000) + " thousand"
    : "Rupees " + Math.round(n);

export function nextId(db: DB, kind: EntityName): number {
  let max = 0;
  for (const r of db[kind] as any[]) {
    const n = Number(r.id);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max + 1;
}

export function nextCode(db: DB, kind: EntityName, prefix: string): string {
  let max = 0;
  let digits = 3;
  for (const r of db[kind] as any[]) {
    const m = String(r.code ?? r.id).match(/(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      max = Math.max(max, n);
      digits = Math.max(digits, m[1].length);
    }
  }
  return prefix + String(max + 1).padStart(digits, "0");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
};
