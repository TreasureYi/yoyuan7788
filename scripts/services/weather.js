export async function fetchWeatherReportByCoordinates(latitude, longitude, label = "当前位置") {
  const resolvedLabel = await resolveLocationLabel(latitude, longitude, label).catch(() => label);
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
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&language=zh&format=json`
  );

  if (!response.ok) {
    return fallback;
  }

  const payload = await response.json();
  const first = payload?.results?.[0];
  if (!first) {
    return fallback;
  }

  const parts = [first.admin1, first.name].filter(Boolean);
  return parts.join(" · ") || fallback;
}
