export function fmtCurrency(n: number | null | undefined) {
  if (n == null) return "—";
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmt(n: number | null | undefined, prefix = "") {
  if (n == null) return "—";
  return prefix + n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function fmtInt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
}

export function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(2) + "%";
}
