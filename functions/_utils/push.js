export function normalizePushPayload(payload) {
  const installationId = String(payload?.installationId || "").trim();
  const endpoint = String(payload?.subscription?.endpoint || payload?.endpoint || "").trim();
  const p256dh = String(payload?.subscription?.keys?.p256dh || "").trim();
  const auth = String(payload?.subscription?.keys?.auth || "").trim();
  const salaryDay = clampInteger(payload?.salaryDay, 1, 28, 15);
  const leadDays = clampInteger(payload?.leadDays, 0, 7, 0);
  const permission = String(payload?.permission || "default").trim() || "default";
  const appName = String(payload?.appName || "薪期台账").trim() || "薪期台账";

  return {
    installationId,
    endpoint,
    p256dh,
    auth,
    salaryDay,
    leadDays,
    permission,
    appName
  };
}

export function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}
