const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchJson(url, { signal } = {}) {
  let response;

  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`Unable to connect to Open-Meteo: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status} ${response.statusText}).`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Open-Meteo returned an invalid response: ${error.message}`);
  }
}

export async function searchCity(name, options = {}) {
  const query = encodeURIComponent(name.trim());
  const url = `${GEOCODING_URL}?name=${query}&count=5`;
  let data;

  try {
    data = await fetchJson(url, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`Could not search for cities: ${error.message}`);
  }

  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) {
    throw new Error("Open-Meteo returned an invalid city search result.");
  }

  return data.results.map(({ name: cityName, country, admin1, admin2, latitude, longitude, timezone }) => ({
    name: cityName,
    country,
    region: admin1 || admin2 || "",
    latitude,
    longitude,
    timezone,
  }));
}

export async function getForecast(latitude, longitude, options = {}) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });
  let data;

  try {
    data = await fetchJson(`${FORECAST_URL}?${params}`, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`Could not load the forecast: ${error.message}`);
  }

  if (!data.current || !data.daily) {
    throw new Error("Open-Meteo returned incomplete forecast data.");
  }

  return data;
}
