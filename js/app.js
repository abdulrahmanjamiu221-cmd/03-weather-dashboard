import { getForecast, searchCity } from "./api.js";
import { renderFavorites, renderLocalTime, renderWeather, setStatus } from "./ui.js";

const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const favoriteCities = ["Copenhagen", "Lisbon", "Tokyo"];
let activeRequest = 0;

async function showCity(cityName) {
  const query = cityName.trim();
  if (!query) return false;

  const requestId = ++activeRequest;
  setStatus("Loading…");

  try {
    const cities = await searchCity(query);
    if (requestId !== activeRequest) return false;
    if (cities.length === 0) {
      setStatus(`We couldn't find "${query}". Check the spelling and try another city.`);
      return false;
    }

    const city = cities[0];
    const forecast = await getForecast(city.latitude, city.longitude);
    if (requestId !== activeRequest) return false;

    renderWeather(city, forecast);
    renderFavorites(favoriteCities, city.name);
    renderLocalTime(forecast.timezone || city.timezone);
    setStatus("");
    return true;
  } catch (error) {
    if (requestId !== activeRequest) return false;
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
    return false;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const didLoad = await showCity(cityInput.value);
    if (didLoad) {
      cityInput.value = "";
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

document.querySelector("#favorites-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-city]");
  if (!button) return;

  try {
    await showCity(button.dataset.city);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

window.setInterval(() => {
  const timezone = document.querySelector("#local-time").dataset.timezone;
  if (timezone) renderLocalTime(timezone);
}, 60_000);

try {
  await showCity("Oslo");
} catch (error) {
  setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
}
