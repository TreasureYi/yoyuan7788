import { badRequest, json } from "../../_utils/http.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const latitude = getCoordinate(url.searchParams.get("latitude"), -90, 90);
  const longitude = getCoordinate(url.searchParams.get("longitude"), -180, 180);

  if (latitude === null || longitude === null) {
    return badRequest("缺少有效的定位坐标");
  }

  const lookupUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  lookupUrl.searchParams.set("format", "jsonv2");
  lookupUrl.searchParams.set("lat", String(latitude));
  lookupUrl.searchParams.set("lon", String(longitude));
  lookupUrl.searchParams.set("zoom", "10");
  lookupUrl.searchParams.set("addressdetails", "1");
  lookupUrl.searchParams.set("accept-language", "zh-CN");
  const edgeLocation = formatEdgeLocation(context.request.cf);
  const coordinateLabel = formatCoordinateLabel(latitude, longitude);

  try {
    const response = await fetchWithTimeout(lookupUrl, 3500, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Xinqi Reminder/1.0 (personal weather location lookup)"
      }
    });

    if (!response.ok) {
      return json({ city: edgeLocation || coordinateLabel });
    }

    const payload = await response.json();
    return json(
      { city: formatLocation(payload) },
      {
        headers: {
          "Cache-Control": "private, max-age=1800"
        }
      }
    );
  } catch (error) {
    return json({ city: edgeLocation || coordinateLabel });
  }
}

function getCoordinate(value, min, max) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    return null;
  }

  return coordinate;
}

function formatLocation(payload) {
  const address = payload?.address || {};
  const province = address.state || address.province || "";
  const city = address.city || address.town || address.village || address.municipality || address.county || "";
  const district = address.city_district || address.district || address.suburb || "";
  const parts = [province, city, district].filter((part, index, values) => part && values.indexOf(part) === index);

  return parts.join(" · ") || String(payload?.display_name || "当前位置").split(",").slice(0, 2).join(" · ");
}

function formatEdgeLocation(cf) {
  const city = String(cf?.city || "").trim();
  const region = String(cf?.region || "").trim();
  return [region, city].filter((part, index, values) => part && values.indexOf(part) === index).join(" · ");
}

function formatCoordinateLabel(latitude, longitude) {
  return `北纬 ${latitude.toFixed(2)}° · 东经 ${longitude.toFixed(2)}°`;
}

async function fetchWithTimeout(url, timeout, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
