import { badRequest, json } from "../../_utils/http.js";

export async function onRequestPost(context) {
  if (!context.env.DB) {
    return badRequest("缺少 D1 绑定 DB", 503);
  }

  const body = await context.request.json().catch(() => null);
  if (!body) {
    return badRequest("请求体必须是合法 JSON");
  }

  const installationId = String(body.installationId || "").trim();
  const endpoint = String(body.endpoint || "").trim();

  if (!installationId && !endpoint) {
    return badRequest("缺少 installationId 或 endpoint");
  }

  const now = new Date().toISOString();
  if (installationId) {
    await context.env.DB.prepare(
      `
        UPDATE salary_push_subscriptions
        SET enabled = 0, updated_at = ?
        WHERE installation_id = ?
      `
    )
      .bind(now, installationId)
      .run();
  } else {
    await context.env.DB.prepare(
      `
        UPDATE salary_push_subscriptions
        SET enabled = 0, updated_at = ?
        WHERE endpoint = ?
      `
    )
      .bind(now, endpoint)
      .run();
  }

  return json({
    ok: true,
    disabledAt: now
  });
}
