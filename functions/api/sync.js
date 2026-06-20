import { badRequest, json } from "../_utils/http.js";

const MAX_ENCRYPTED_DATA_SIZE = 256000;

export async function onRequestPost(context) {
  if (!context.env.DB) {
    return badRequest("缺少 D1 绑定 DB", 503);
  }

  const body = await context.request.json().catch(() => null);
  if (!body) {
    return badRequest("请求体必须是合法 JSON");
  }

  const action = String(body.action || "");
  const syncId = String(body.syncId || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(syncId)) {
    return badRequest("同步标识无效");
  }

  if (action === "load") {
    const record = await context.env.DB.prepare(
      "SELECT encrypted_data, updated_at FROM encrypted_user_backups WHERE sync_id = ?1"
    )
      .bind(syncId)
      .first();

    if (!record) {
      return badRequest("没有找到云端备份", 404);
    }

    return json({
      ok: true,
      encryptedData: safeParseEncryptedData(record.encrypted_data),
      updatedAt: record.updated_at
    });
  }

  if (action === "save") {
    const encryptedData = normalizeEncryptedData(body.encryptedData);
    if (!encryptedData) {
      return badRequest("加密数据无效");
    }

    const serialized = JSON.stringify(encryptedData);
    if (serialized.length > MAX_ENCRYPTED_DATA_SIZE) {
      return badRequest("备份内容过大", 413);
    }

    const now = new Date().toISOString();
    await context.env.DB.prepare(
      `
        INSERT INTO encrypted_user_backups (sync_id, encrypted_data, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?3)
        ON CONFLICT(sync_id) DO UPDATE SET
          encrypted_data = excluded.encrypted_data,
          updated_at = excluded.updated_at
      `
    )
      .bind(syncId, serialized, now)
      .run();

    return json({
      ok: true,
      updatedAt: now
    });
  }

  return badRequest("不支持的同步操作");
}

function normalizeEncryptedData(value) {
  if (
    value?.algorithm !== "AES-GCM" ||
    !/^[A-Za-z0-9_-]{16}$/.test(String(value.iv || "")) ||
    !/^[A-Za-z0-9_-]{16,350000}$/.test(String(value.ciphertext || ""))
  ) {
    return null;
  }

  return {
    algorithm: "AES-GCM",
    iv: String(value.iv),
    ciphertext: String(value.ciphertext)
  };
}

function safeParseEncryptedData(value) {
  try {
    return normalizeEncryptedData(JSON.parse(value));
  } catch (error) {
    return null;
  }
}
