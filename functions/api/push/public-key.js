import { badRequest, json } from "../../_utils/http.js";

export async function onRequestGet(context) {
  const publicKey = context.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return badRequest("缺少 VAPID_PUBLIC_KEY 环境变量", 503);
  }

  return json({
    publicKey
  });
}
