export async function fetchWeatherReportByCoordinates(latitude, longitude) {
  const fallbackLabel = formatCoordinateLabel(latitude, longitude);
  const resolvedLabel = await resolveLocationLabel(latitude, longitude, fallbackLabel).catch(() => fallbackLabel);
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
  );

  if (!weatherResponse.ok) {
    throw new Error("天气服务暂时不可用");
  }

  const weatherData = await weatherResponse.json();

  return {
    city: resolvedLabel,
    country: "自动定位",
    temperature: weatherData?.current?.temperature_2m,
    apparentTemperature: weatherData?.current?.apparent_temperature,
    weatherCode: weatherData?.current?.weather_code,
    windSpeed: weatherData?.current?.wind_speed_10m
  };
}

async function resolveLocationLabel(latitude, longitude, fallback) {
  try {
    const response = await fetch(
      `/api/weather/location?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
    );
    if (response.ok) {
      const payload = await response.json();
      const city = String(payload?.city || "").trim();
      if (city) {
        return city;
      }
    }
  } catch (error) {
    // 本地静态预览没有 Pages Function，继续尝试公共地址查询服务。
  }

  const response = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1&accept-language=zh-CN`,
    3500
  );
  if (!response.ok) {
    return fallback;
  }
  const payload = await response.json();
  return formatNominatimLocation(payload) || fallback;
}

function formatCoordinateLabel(latitude, longitude) {
  return `北纬 ${Number(latitude).toFixed(2)}° · 东经 ${Number(longitude).toFixed(2)}°`;
}

function formatNominatimLocation(payload) {
  const address = payload?.address || {};
  const province = address.state || address.province || "";
  const city = address.city || address.town || address.village || address.municipality || address.county || "";
  const district = address.city_district || address.district || address.suburb || "";
  const parts = [province, city, district].filter((part, index, values) => part && values.indexOf(part) === index);

  return parts.join(" · ") || String(payload?.display_name || "").split(",").slice(0, 2).join(" · ").trim();
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}
