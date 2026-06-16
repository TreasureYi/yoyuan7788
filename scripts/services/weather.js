export async function fetchWeatherReport(city) {
  const locationResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`
  );

  if (!locationResponse.ok) {
    throw new Error("定位服务暂时不可用");
  }

  const locationData = await locationResponse.json();
  const first = locationData?.results?.[0];

  if (!first) {
    throw new Error("没有找到这个城市，请试试英文名或更完整的地名");
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${first.latitude}&longitude=${first.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
  );

  if (!weatherResponse.ok) {
    throw new Error("天气服务暂时不可用");
  }

  const weatherData = await weatherResponse.json();

  return {
    city: first.name,
    country: first.country,
    temperature: weatherData?.current?.temperature_2m,
    apparentTemperature: weatherData?.current?.apparent_temperature,
    weatherCode: weatherData?.current?.weather_code,
    windSpeed: weatherData?.current?.wind_speed_10m
  };
}
