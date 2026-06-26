export type WeatherCondition = "rain" | "snow" | "fog" | "storm" | "clear";

// Stub — always returns undefined (clear). Wire to Open-Meteo API in a future task.
export async function getWeather(
  _lat: number,
  _lon: number
): Promise<WeatherCondition | undefined> {
  return undefined;
}
