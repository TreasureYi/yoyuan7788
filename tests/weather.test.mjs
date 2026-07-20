import assert from "node:assert/strict";
import test from "node:test";

import { buildWeatherAdvice, fetchWeatherReportByCoordinates } from "../scripts/services/weather.js";

test("uses the current-hour rain signal when current conditions still say clear", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.startsWith("/api/weather/location")) {
      return jsonResponse({ city: "上海" });
    }

    return jsonResponse({
      latitude: 31.23,
      longitude: 121.47,
      timezone: "Asia/Shanghai",
      current: {
        time: "2026-07-20T13:00",
        temperature_2m: 33.1,
        apparent_temperature: 40.6,
        relative_humidity_2m: 64,
        is_day: 1,
        precipitation: 0,
        rain: 0,
        showers: 0,
        snowfall: 0,
        weather_code: 1,
        wind_speed_10m: 6.9,
        wind_direction_10m: 223,
        wind_gusts_10m: 26.3
      },
      hourly: {
        time: ["2026-07-20T13:00", "2026-07-20T14:00"],
        temperature_2m: [33.1, 33.5],
        weather_code: [51, 80],
        precipitation_probability: [42, 62]
      },
      daily: {
        time: ["2026-07-20"],
        weather_code: [96],
        temperature_2m_max: [33.5],
        temperature_2m_min: [26.9],
        precipitation_probability_max: [90],
        uv_index_max: [8.4],
        precipitation_sum: [9.4],
        wind_speed_10m_max: [8.5],
        wind_gusts_10m_max: [26.6],
        sunrise: ["2026-07-20T05:03"],
        sunset: ["2026-07-20T18:57"]
      }
    });
  };

  try {
    const report = await fetchWeatherReportByCoordinates(31.23, 121.47);
    assert.equal(report.city, "上海");
    assert.equal(report.weatherCode, 51);
    assert.equal(report.rainProbability, 42);
    assert.equal(report.dailyForecast.length, 1);
    assert.equal("latitude" in report, false);
    assert.equal("longitude" in report, false);
    assert.ok(report.advice.some((item) => item.kind === "umbrella"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("creates rain and heat advice from actual conditions", () => {
  const advice = buildWeatherAdvice({
    temperature: 34,
    apparentTemperature: 39,
    weatherCode: 61,
    rain: 0.8,
    showers: 0,
    snowfall: 0,
    rainProbability: 80,
    windGusts: 20,
    dailyForecast: [{ uvIndex: 3 }]
  });

  assert.deepEqual(advice.map((item) => item.title), ["清凉着装", "正在降水"]);
});

test("prioritizes thunderstorm safety over generic rain advice", () => {
  const advice = buildWeatherAdvice({
    temperature: 23,
    apparentTemperature: 24,
    weatherCode: 96,
    rain: 0,
    showers: 0,
    snowfall: 0,
    rainProbability: 75,
    windGusts: 55,
    dailyForecast: [{ uvIndex: 1 }]
  });

  assert.equal(advice[1].title, "雷雨提醒");
  assert.ok(!advice.some((item) => item.title === "带好雨具"));
});

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
