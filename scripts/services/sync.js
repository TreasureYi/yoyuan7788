import { RECOVERY_CODE_KEY } from "../config.js";

const SYNC_ENDPOINT = "/api/sync";
const RECOVERY_BYTES = 24;

export function getRecoveryCode() {
  return normalizeRecoveryCode(localStorage.getItem(RECOVERY_CODE_KEY) || "");
}

export function hasCloudBackup() {
  return Boolean(getRecoveryCode());
}

export async function createCloudBackup(snapshot) {
  const recoveryCode = generateRecoveryCode();
  await saveEncryptedSnapshot(recoveryCode, snapshot);
  localStorage.setItem(RECOVERY_CODE_KEY, recoveryCode);
  return recoveryCode;
}

export async function syncCloudBackup(snapshot) {
  const recoveryCode = getRecoveryCode();
  if (!recoveryCode) {
    return null;
  }

  return saveEncryptedSnapshot(recoveryCode, snapshot);
}

export async function restoreCloudBackup(rawRecoveryCode) {
  const recoveryCode = normalizeRecoveryCode(rawRecoveryCode);
  if (!isValidRecoveryCode(recoveryCode)) {
    throw new Error("恢复码格式不正确");
  }

  const syncId = await deriveSyncId(recoveryCode);
  const response = await fetch(SYNC_ENDPOINT, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      action: "load",
      syncId
    })
  });
  const payload = await readResponse(response);
  if (!payload?.encryptedData) {
    throw new Error("没有找到这份云端备份");
  }

  const snapshot = await decryptSnapshot(recoveryCode, payload.encryptedData);
  localStorage.setItem(RECOVERY_CODE_KEY, recoveryCode);

  return {
    snapshot,
    updatedAt: payload.updatedAt || ""
  };
}

export function forgetCloudBackupOnDevice() {
  localStorage.removeItem(RECOVERY_CODE_KEY);
}

async function saveEncryptedSnapshot(recoveryCode, snapshot) {
  const [syncId, encryptedData] = await Promise.all([
    deriveSyncId(recoveryCode),
    encryptSnapshot(recoveryCode, snapshot)
  ]);
  const response = await fetch(SYNC_ENDPOINT, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      action: "save",
      syncId,
      encryptedData
    })
  });

  return readResponse(response);
}

async function encryptSnapshot(recoveryCode, snapshot) {
  const key = await deriveEncryptionKey(recoveryCode);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(snapshot));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  return {
    algorithm: "AES-GCM",
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(new Uint8Array(encrypted))
  };
}

async function decryptSnapshot(recoveryCode, encryptedData) {
  try {
    const key = await deriveEncryptionKey(recoveryCode);
    const iv = fromBase64Url(encryptedData.iv);
    const ciphertext = fromBase64Url(encryptedData.ciphertext);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    throw new Error("恢复码无法解密这份备份");
  }
}

async function deriveEncryptionKey(recoveryCode) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(recoveryCode));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function deriveSyncId(recoveryCode) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`yoyuan-sync:${recoveryCode}`)
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateRecoveryCode() {
  const value = Array.from(
    crypto.getRandomValues(new Uint8Array(RECOVERY_BYTES)),
    (byte) => byte.toString(16).padStart(2, "0")
  )
    .join("")
    .toUpperCase();
  return value.match(/.{1,4}/g).join("-");
}

function normalizeRecoveryCode(value) {
  const compact = String(value || "").toUpperCase().replace(/[^A-F0-9]/g, "");
  return compact.match(/.{1,4}/g)?.join("-") || "";
}

function isValidRecoveryCode(value) {
  return /^[A-F0-9]{48}$/.test(value.replace(/-/g, ""));
}

function toBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "云端同步失败");
  }
  return payload;
}
