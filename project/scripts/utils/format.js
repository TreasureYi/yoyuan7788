export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatAmount(value) {
  const content = String(value || "").trim();
  return content || "未设置";
}

export function formatAccount(value) {
  const content = String(value || "").trim();
  return content || "未填写";
}

export function formatTemperature(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}°`;
}
